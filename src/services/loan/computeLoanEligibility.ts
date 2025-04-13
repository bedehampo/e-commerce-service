import { UserService } from "../../lib/userService";
import { checkUserById } from "../../middlewares/validators";
import Loan from "../../model/Loan/Loan";
import LoanEligibilitySettings from "../../model/Loan/LoanEligibilitySettings";
import {
	AccountTierKey,
	AdditionalCreditHistoryKey,
	AgeKey,
	CreditHistoryKey,
	LoanEligibilityType,
} from "../../types/loan";
import crcService from "../../lib/crc";
import { ComputeLoanEligibilityInput } from "../../validation/loan.schema";
import config from "../../config";
import LoanBio from "../../model/Loan/LoanBio";
import LoanEligibility from "../../model/Loan/LoanEligibility";

const computeLoanEligibility = async (
	userId: number,
	userService: UserService,
	params: ComputeLoanEligibilityInput["body"]
) => {
	const { bvn } = params;
	let totalEligibilityScore: number = 0;
	const user = await checkUserById(userId, userService);
	const date_of_birth = user.dob; //dd-mm-yyyy
	const age =
		new Date().getFullYear() -
		new Date(date_of_birth).getFullYear();

	let ageRequirementKey: string;

	if (age < 25 || age > 55) {
		ageRequirementKey =
			AgeKey.below_25_years_above_55_years;
	} else if (age >= 25 && age <= 40) {
		ageRequirementKey = AgeKey["25_40_years"];
	} else if (age >= 41 && age <= 55) {
		ageRequirementKey = AgeKey["41_55_years"];
	}

	const ageLoanEligibilitySettings =
		await LoanEligibilitySettings.findOne({
			key: ageRequirementKey,
		});

	if (ageLoanEligibilitySettings) {
		totalEligibilityScore +=
			ageLoanEligibilitySettings.value;
	}
	// console.log("age", ageLoanEligibilitySettings);

	let userAccountTier = user.tier as number;

	let accountTierRequirementKey: string;

	let accountTierKeyPair = {
		1: AccountTierKey.TIER1,
		2: AccountTierKey.TIER2,
		3: AccountTierKey.TIER3,
	};

	accountTierRequirementKey =
		accountTierKeyPair[userAccountTier];

	const accountTierEligibilitySettings =
		await LoanEligibilitySettings.findOne({
			key: accountTierRequirementKey,
		});

	if (accountTierEligibilitySettings) {
		totalEligibilityScore +=
			accountTierEligibilitySettings.value;
	}

	//additional credit history(number of loans taken by the user)
	let { additionalCreditHistoryScore } =
		await computeCreditHistoryScore(bvn);

	totalEligibilityScore += additionalCreditHistoryScore;

	//periculum income query call
	const income = 400000;

	let eligibleFunds = 0;
	if (totalEligibilityScore <= 34) {
		eligibleFunds = 0;
	}

	if (
		totalEligibilityScore <= 35 &&
		totalEligibilityScore >= 49
	) {
		eligibleFunds = income * 0.1; //10% of monthly turnover
	}
	if (
		totalEligibilityScore <= 50 &&
		totalEligibilityScore >= 99
	) {
		eligibleFunds = income * 0.5; //50% of monthly turnover
	}
	if (
		totalEligibilityScore <= 100 &&
		totalEligibilityScore >= 120
	) {
		eligibleFunds = income * 0.8; //80% of monthly turnover
	}

	let minimumLoanAmount = 50000;

	if (eligibleFunds < minimumLoanAmount) {
		eligibleFunds = minimumLoanAmount;
	}

	//check if user has loan eligibility record

	const loanEligibility = await LoanEligibility.findOne({
		user: userId,
	});

	if (loanEligibility) {
		loanEligibility.score = totalEligibilityScore;
		loanEligibility.eligibleFunds = eligibleFunds;
		await loanEligibility.save();
	} else {
		await LoanEligibility.create({
			user: userId,
			score: totalEligibilityScore,
			eligibleFunds,
		});
	}

	// return crcResult;
	return {
		totalEligibilityScore,
		eligibleFunds,
	};
};

export default computeLoanEligibility;

const computeCreditHistoryScore = async (
	bvn: string
): Promise<{
	creditHistoryScore: number;
	additionalCreditHistoryScore: number;
}> => {
	const bvnPayload = config.env.isDevelopment
		? "22170216986"
		: bvn;
	const response =
		await crcService.getClassicStandardCreditDetailsByBVN(
			bvnPayload
		);
	;

	// if (response.ConsumerSearchResultResponse) {
	let bureauIds =
		response.ConsumerSearchResultResponse.BODY.SEARCHRESULTLIST.map(
			(result) => result.BUREAUID
		);
	let primaryBureauId =
		response.ConsumerSearchResultResponse.BODY
			.SEARCHRESULTLIST[0].BUREAUID;

	const singleHitMerge =
		await crcService.getClassicStandardCreditDetailsByBVNMergeRequest(
			response.ConsumerSearchResultResponse.REFERENCENO,
			response.ConsumerSearchResultResponse.BODY
				.SEARCHRESULTLIST[0].BUREAUID,
			bureauIds
		);

	let numberofCrcLoans =
		singleHitMerge.ConsumerHitResponse.BODY
			.CreditFacilityHistory24.length;
	let creditProfileOverview =
		singleHitMerge.ConsumerHitResponse.BODY
			.CreditProfileOverview;

	let maxDefaultInfo = creditProfileOverview.find(
		(item) => item.INDICATOR_TYPE === "MAX_OVERDUE_FACILITY"
	);

	let numberOfDefaults = Number(maxDefaultInfo.VALUE);

	let creditHistoryValue: string;
	if (numberOfDefaults === 0) {
		creditHistoryValue =
			CreditHistoryKey.NO_PREVIOUS_DEFAULT;
	} else if (numberOfDefaults === 1) {
		creditHistoryValue =
			CreditHistoryKey.ONE_PREVIOUS_DEFAULT;
	} else if (numberOfDefaults > 1) {
		creditHistoryValue =
			CreditHistoryKey.MULTIPLE_PREVIOUS_DEFAULTS;
	}

	let additionalCreditHistoryValue: string;
	if (numberofCrcLoans === 0) {
		additionalCreditHistoryValue =
			AdditionalCreditHistoryKey.NOPREVIOUSLOAN;
	} else if (numberofCrcLoans === 1) {
		additionalCreditHistoryValue =
			AdditionalCreditHistoryKey.ONELOAN;
	} else if (numberofCrcLoans > 1) {
		additionalCreditHistoryValue =
			AdditionalCreditHistoryKey.MULTIPLELOAN;
	}

	const additionalCreditHistoryEligibilitySettings =
		await LoanEligibilitySettings.findOne({
			key: additionalCreditHistoryValue,
		});

	const creditHistoryEligibilitySettings =
		await LoanEligibilitySettings.findOne({
			key: creditHistoryValue,
		});

	return {
		creditHistoryScore:
			creditHistoryEligibilitySettings.value,
		additionalCreditHistoryScore:
			additionalCreditHistoryEligibilitySettings.value,
	};
};
