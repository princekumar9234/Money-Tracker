export class ApiResponse {
  constructor(statusCode, message = 'Success', data = null, meta = null) {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    if (data !== null) this.data = data;
    if (meta !== null) this.meta = meta;
  }

  static success(res, message = 'Success', data = {}, statusCode = 200, meta = null) {
    const payload = {
      success: true,
      message,
      data
    };
    if (meta) payload.meta = meta;
    return res.status(statusCode).json(payload);
  }

  static created(res, message = 'Resource created successfully', data = {}) {
    return res.status(201).json({
      success: true,
      message,
      data
    });
  }
}
