import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

/**
 * Telegram Notification Service
 * Sends formatted messages to Telegram chat/group
 * Used for real-time monitoring and alerting
 */
@Injectable()
export class TelegramNotificationService {
  private readonly logger = new Logger(TelegramNotificationService.name);
  private readonly botToken: string;
  private readonly chatId: string;
  private readonly enabled: boolean;
  private readonly axiosInstance: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN', '');
    this.chatId = this.configService.get<string>('TELEGRAM_CHAT_ID', '');
    this.enabled = this.configService.get<string>('TELEGRAM_NOTIFICATIONS_ENABLED', 'false') === 'true';

    if (this.enabled && (!this.botToken || !this.chatId)) {
      this.logger.warn(
        'Telegram notifications enabled but TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured',
      );
      this.enabled = false;
    }

    this.axiosInstance = axios.create({
      baseURL: `https://api.telegram.org/bot${this.botToken}`,
      timeout: 10000,
    });

    if (this.enabled) {
      this.logger.log('Telegram Notification Service initialized');
    } else {
      this.logger.debug('Telegram notifications disabled');
    }
  }

  /**
   * Send success message to Telegram
   */
  async sendSuccess(title: string, data: Record<string, any>): Promise<void> {
    if (!this.enabled) return;

    const message = this.formatSuccessMessage(title, data);
    await this.sendMessage(message);
  }

  /**
   * Send error message to Telegram
   */
  async sendError(title: string, error: Error | string, context?: Record<string, any>): Promise<void> {
    if (!this.enabled) return;

    const message = this.formatErrorMessage(title, error, context);
    await this.sendMessage(message);
  }

  /**
   * Send info message to Telegram
   */
  async sendInfo(title: string, data: Record<string, any>): Promise<void> {
    if (!this.enabled) return;

    const message = this.formatInfoMessage(title, data);
    await this.sendMessage(message);
  }

  /**
   * Send warning message to Telegram
   */
  async sendWarning(title: string, data: Record<string, any>): Promise<void> {
    if (!this.enabled) return;

    const message = this.formatWarningMessage(title, data);
    await this.sendMessage(message);
  }

  /**
   * Send raw message to Telegram
   */
  private async sendMessage(text: string): Promise<void> {
    try {
      await this.axiosInstance.post('/sendMessage', {
        chat_id: this.chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });
    } catch (error) {
      // Don't throw error to avoid breaking the main flow
      this.logger.error('Failed to send Telegram notification', {
        error: error.message,
        response: error.response?.data,
      });
    }
  }

  /**
   * Format success message with green circle emoji
   */
  private formatSuccessMessage(title: string, data: Record<string, any>): string {
    const timestamp = new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });

    let message = `🟢 <b>${this.escapeHtml(title)}</b>\n`;
    message += `⏰ ${timestamp}\n\n`;

    for (const [key, value] of Object.entries(data)) {
      const formattedValue = this.formatValue(value);
      message += `<b>${this.escapeHtml(key)}:</b> ${formattedValue}\n`;
    }

    return message;
  }

  /**
   * Format error message with red circle emoji
   */
  private formatErrorMessage(
    title: string,
    error: Error | string,
    context?: Record<string, any>,
  ): string {
    const timestamp = new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });

    let message = `🔴 <b>${this.escapeHtml(title)}</b>\n`;
    message += `⏰ ${timestamp}\n\n`;

    const errorMessage = typeof error === 'string' ? error : error.message;
    message += `<b>Error:</b> ${this.escapeHtml(errorMessage)}\n`;

    if (typeof error === 'object' && error.stack) {
      const stackLines = error.stack.split('\n').slice(0, 3);
      message += `<b>Stack:</b>\n<code>${this.escapeHtml(stackLines.join('\n'))}</code>\n`;
    }

    if (context) {
      message += `\n<b>Context:</b>\n`;
      for (const [key, value] of Object.entries(context)) {
        const formattedValue = this.formatValue(value);
        message += `<b>${this.escapeHtml(key)}:</b> ${formattedValue}\n`;
      }
    }

    return message;
  }

  /**
   * Format info message with blue circle emoji
   */
  private formatInfoMessage(title: string, data: Record<string, any>): string {
    const timestamp = new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });

    let message = `🔵 <b>${this.escapeHtml(title)}</b>\n`;
    message += `⏰ ${timestamp}\n\n`;

    for (const [key, value] of Object.entries(data)) {
      const formattedValue = this.formatValue(value);
      message += `<b>${this.escapeHtml(key)}:</b> ${formattedValue}\n`;
    }

    return message;
  }

  /**
   * Format warning message with yellow circle emoji
   */
  private formatWarningMessage(title: string, data: Record<string, any>): string {
    const timestamp = new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });

    let message = `🟡 <b>${this.escapeHtml(title)}</b>\n`;
    message += `⏰ ${timestamp}\n\n`;

    for (const [key, value] of Object.entries(data)) {
      const formattedValue = this.formatValue(value);
      message += `<b>${this.escapeHtml(key)}:</b> ${formattedValue}\n`;
    }

    return message;
  }

  /**
   * Format value for display
   */
  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '<i>null</i>';
    }

    if (typeof value === 'object') {
      const jsonStr = JSON.stringify(value, null, 2);
      // Truncate if too long
      if (jsonStr.length > 500) {
        return `<code>${this.escapeHtml(jsonStr.substring(0, 500))}...</code>`;
      }
      return `<code>${this.escapeHtml(jsonStr)}</code>`;
    }

    return this.escapeHtml(String(value));
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Check if notifications are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}