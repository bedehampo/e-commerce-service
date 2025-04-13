// import { NextFunction, Request, Response } from "express";
// import { successResponse } from "../helpers";
// import { filterResults, performSearch } from "../services/searchModule";
// import { IFilterCriteria } from "../utils/interfaces";

// const search = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const query = req.query.q as string;
//         const results = await performSearch(query);


//         return res.send(successResponse("", results));
//     } catch (err) {
//         console.error(err);
//         next(err);
//     }
// }

// const filter = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const criteria: IFilterCriteria = {
//             minPrice: parseFloat(req.query.minPrice as string),
//             maxPrice: parseFloat(req.query.maxPrice as string),
//             category: req.query.category as string,
//             // other filter criteria here
//         };
//         const filteredResults = await filterResults(criteria);
//         return res.send(successResponse("Filter successfully", filteredResults));
//     } catch (err) {
//         console.error(err);
//         next(err);
//     }
// }