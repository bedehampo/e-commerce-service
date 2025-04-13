import express, { Response, Request, NextFunction } from "express";
import { AuthorizationError, NotFoundError, ValidationError } from "../errors";
import { successResponse } from "../helpers";
import { MainWallet } from "../model/budgetWallets/MainWallets";
import EventRequest from "../model/event/eventRequest";
import platformEvent from "../model/event/platformEvent";
import { CustomRequest } from "../utils/interfaces";
import { CreateEventInput } from "../validation/event.schema";
import { CreateEventRequestInput } from "../validation/eventRequest.schema";

export const getEvents = async (
  req: CustomRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  const userId = req.user && req.user.id;
  try {
    const events = await EventRequest.findOne({
      user: userId,
    });
    return res.send(successResponse("Events fetched successfully", events));
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;
    const {
      description,
      title,
      number_of_tickets_available,
      regularPrice,
      vipPrice,
      tableForFivePrice,
      tableForTenPrice,
      pricePerTicket,
      discount,
      featured_artists,
    } = data as CreateEventInput["body"];

    if (!regularPrice && !vipPrice && !tableForFivePrice && !tableForTenPrice) {
      throw new ValidationError("At least one ticket price is required");
    }
    const categories = [
      regularPrice && {
        title: "regular",
        price: regularPrice,
      },
      vipPrice && {
        title: "vip",
        price: vipPrice,
      },
      tableForFivePrice && {
        title: "table_for_five",
        price: tableForFivePrice,
      },
      tableForTenPrice
        ? {
            title: "table_for_ten",
            price: tableForTenPrice,
          }
        : undefined,
    ];

    const newEvent = await platformEvent.create({
      ...data,
      categories,
    });
    return res.send(successResponse("A new event has been created", newEvent));
  } catch (error) {
    next(error);
  }
};

export const createEventRequest = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;
    const userId = req.user && req.user.id;
    const { name, email, no_of_tickets, category, phone_number, event } =
      data as CreateEventRequestInput["body"];

    const isEvent = await platformEvent.findById(event);

    if (!isEvent) {
      throw new NotFoundError("Event not found");
    }

    const availableNumberOfTickets = isEvent?.number_of_tickets_available;

    if (availableNumberOfTickets < no_of_tickets) {
      throw new AuthorizationError("This event is sold out");
    }

    // const usersWallet = await MainWallet.findOne({ userId: userId });

    // if (!usersWallet) {
    //   throw new NotFoundError("Wallet not found");
    // }

    const eventCategories = isEvent?.categories;

    const price = eventCategories.find(
      (cat: any) => cat.title === category
    )?.price;
    console.log(price);

    // const walletBalance = usersWallet.balance;

    // if (Number(walletBalance) < Number(price)) {
    //   throw new AuthorizationError(
    //     "Insufficient funds, please top up your wallet"
    //   );
    // }

    if (!price) {
      throw new ValidationError("Invalid ticket category");
    }

    // const newBalance = Number(walletBalance) - Number(price);

    // await MainWallet.findOneAndUpdate(
    //   { userId: userId },
    //   { balance: newBalance }
    // );

    const newNumberOfTickets =
      Number(availableNumberOfTickets) - Number(no_of_tickets);

    await platformEvent.findOneAndUpdate(
      {
        _id: event,
      },
      { number_of_tickets_available: newNumberOfTickets }
    );

    const newEventRequest = await EventRequest.create({
      ...data,
      userId,
    });
    return res.send(
      successResponse("A new event equest has been created", newEventRequest)
    );
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async () => {};
