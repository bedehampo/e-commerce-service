import { Transactions } from "../model/Transactions";

export const createTransaction = async (
	user,
	amount,
	debitSourceWallet,
	debitDestinationWallet,
	creditSoureWallet,
	creditDestinationWallet,
	description,
	tranferChannel,
	reference,
	sourceOpeningBalance,
	destinationOpeningBalance,
	debitTransactionDsc,
	creditTransactionDsc,
	txnFee,
	totalDebit,
	receiver,
	session
) => {
	const debitTransaction = new Transactions({
		user: user._id,
		transactionType: "debit",
		currency: "NGN",
		amount,
		sourceWallet: debitSourceWallet,
		destinationWallet: debitDestinationWallet,
		description,
		tranferChannel,
		reference,
		openingBalance: sourceOpeningBalance,
		closingBalance: sourceOpeningBalance - amount,
		status: "successful",
		tnxDesc: debitTransactionDsc,
		txnFee,
		totalDebit,
	});

	const creditTransaction = new Transactions({
		user: user._id,
		transactionType: "credit",
		currency: "NGN",
		amount,
		sourceWallet: creditSoureWallet,
		destinationWallet: creditDestinationWallet,
		description,
		tranferChannel,
		reference,
		openingBalance: destinationOpeningBalance,
		closingBalance: destinationOpeningBalance + amount,
		status: "successful",
		txnDesc: creditTransactionDsc,
		txnFee,
		receiver,
	});

	await Promise.all([
		debitTransaction.save({ session }),
		creditTransaction.save({ session }),
	]);

	return {
		debitTransaction,
		creditTransaction,
	};
};
