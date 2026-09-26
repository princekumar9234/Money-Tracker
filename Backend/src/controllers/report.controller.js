import { reportService } from '../services/report.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const generateReport = async (req, res, next) => {
  try {
    const { title } = req.body;
    const report = await reportService.generateReport(req.user._id, title);
    return ApiResponse.created(res, 'Risk report generated successfully', report);
  } catch (error) {
    next(error);
  }
};

export const getReports = async (req, res, next) => {
  try {
    const reports = await reportService.getReports(req.user._id);
    return ApiResponse.success(res, 'Reports retrieved successfully', reports);
  } catch (error) {
    next(error);
  }
};

export const getReportById = async (req, res, next) => {
  try {
    const report = await reportService.getReportById(req.user._id, req.params.id);
    return ApiResponse.success(res, 'Report details retrieved', report);
  } catch (error) {
    next(error);
  }
};

export const deleteReport = async (req, res, next) => {
  try {
    const result = await reportService.deleteReport(req.user._id, req.params.id);
    return ApiResponse.success(res, result.message);
  } catch (error) {
    next(error);
  }
};
