const axios = require('axios');
const Logger = require('./logger');

class HttpClient {
  static async get(url, config = {}) {
    try {
      Logger.debug(`GET ${url}`);
      const response = await axios.get(url, {
        timeout: 10000,
        ...config,
      });
      return response.data;
    } catch (error) {
      Logger.error(`GET Failed ${url}`, { message: error.message, status: error.response?.status });
      throw this._parseError(error);
    }
  }

  static async post(url, data, config = {}) {
    try {
      Logger.debug(`POST ${url}`);
      const response = await axios.post(url, data, {
        timeout: 10000,
        ...config,
      });
      return response.data;
    } catch (error) {
      Logger.error(`POST Failed ${url}`, { message: error.message, status: error.response?.status });
      throw this._parseError(error);
    }
  }

  static async put(url, data, config = {}) {
    try {
      Logger.debug(`PUT ${url}`);
      const response = await axios.put(url, data, {
        timeout: 10000,
        ...config,
      });
      return response.data;
    } catch (error) {
      Logger.error(`PUT Failed ${url}`, { message: error.message });
      throw this._parseError(error);
    }
  }

  static _parseError(error) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.message;
      const err = new Error(message);
      err.status = status;
      err.data = error.response.data;
      return err;
    }

    if (error.request) {
      const err = new Error('Network error: No response from server');
      err.status = 503;
      return err;
    }

    return error;
  }
}

module.exports = HttpClient;
