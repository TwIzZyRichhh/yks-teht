type User = {
  _id: string;
  username: string;
  email: string;
  role: string;
  avatar?: string;
  favouriteRestaurant?: string;
};

type LoginResponse = {
  message: string;
  token: string;
  data: User;
};

export type {User, LoginResponse};
