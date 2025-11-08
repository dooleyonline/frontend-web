import * as auth from "./auth";
import * as category from "./category";
import * as item from "./item";
import * as chat from "./chat";
import * as map from "./map";
import * as user from "./user";

const api = {
  item: item,
  category: category,
  auth: auth,
  chat: chat,
  map: map,
  user: user,
};

export default api;
