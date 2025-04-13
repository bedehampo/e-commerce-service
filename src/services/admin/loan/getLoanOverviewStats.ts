import Loan from "../../../model/Loan/Loan";
import { LoanStatusTypes } from "../../../utils/interfaces";

const getLoanOverviewStatsService = async () => {
  //get 5 recently newly created loans that are pending
  const upcomingLoans = await Loan.find({
    status: LoanStatusTypes.PENDING,
  })
    .sort({ createdAt: -1 })
    .limit(5);

    //total amount disbursed, total amount of all loan with status approved or paid
    const totalAmountDisbursed = await Loan.aggregate([
      {
        $match: {
          status: { $in: [LoanStatusTypes.APPROVED, LoanStatusTypes.COMPLETED] },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);


    //total pending loans 
    const totalPendingLoans = await Loan.countDocuments({
      status: LoanStatusTypes.PENDING,
    });
    
    //total outstanding loans
    const totalOutstandingLoans = await Loan.countDocuments({
      status: LoanStatusTypes.APPROVED,
    });

    return {
      upcomingLoans,
      totalAmountDisbursed: totalAmountDisbursed[0]?.totalAmount || 0,
      totalPendingLoans,
      totalOutstandingLoans,
    };
};

export default getLoanOverviewStatsService;
