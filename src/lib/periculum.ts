import axios from "axios";
import config from "../config";

class PericulumService {
  client: any;

  constructor() {
    this.client = axios.create({
      baseURL: config.periculum.baseUrl,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
