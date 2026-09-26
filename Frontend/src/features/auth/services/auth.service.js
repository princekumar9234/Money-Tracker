import api from '../../../services/api';

export const authService = {
  async register(data) {
    return await api.post('/auth/register', data);
  },

  async login(data) {
    return await api.post('/auth/login', data);
  },

  async logout() {
    return await api.post('/auth/logout');
  },

  async logoutAll() {
    return await api.post('/auth/logout-all');
  },

  async verifyEmail(token) {
    return await api.post('/auth/verify-email', { token });
  },

  async resendVerification(email) {
    return await api.post('/auth/resend-verification', { email });
  },

  async forgotPassword(email) {
    return await api.post('/auth/forgot-password', { email });
  },

  async resetPassword(data) {
    return await api.post('/auth/reset-password', data);
  },

  async changePassword(data) {
    return await api.post('/auth/change-password', data);
  },

  async getMe() {
    return await api.get('/auth/me');
  },
};
