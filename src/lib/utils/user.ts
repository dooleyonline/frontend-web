import { User } from "../types";

export const userFullname = (user: User): string => {
  return user.firstName + " " + user.lastName;
};

export const userInitial = (user: User): string => {
  const first =
    user.firstName.length > 0 ? user.firstName[0].toUpperCase() : "";
  const last = user.lastName.length > 0 ? user.lastName[0].toUpperCase() : "";
  return first + last;
};
