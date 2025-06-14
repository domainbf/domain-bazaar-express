
export const emailStyles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          line-height: 1.6; 
          color: #1f2937; 
          background: #f3f4f6;
          min-height: 100vh;
          padding: 20px;
        }
        .email-container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: #ffffff; 
          border-radius: 12px; 
          overflow: hidden; 
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .header { 
          background: #1f2937; 
          padding: 40px 32px; 
          text-align: center; 
        }
        .logo { 
          color: white; 
          font-size: 28px; 
          font-weight: 800; 
          margin-bottom: 8px;
        }
        .tagline { 
          color: rgba(255,255,255,0.8); 
          font-size: 16px; 
          font-weight: 500;
        }
        .content { 
          padding: 40px 32px; 
          background: #ffffff;
        }
        .title { 
          font-size: 24px; 
          font-weight: 700; 
          color: #1f2937; 
          margin-bottom: 16px;
          line-height: 1.3;
        }
        .subtitle { 
          font-size: 16px; 
          color: #6b7280; 
          margin-bottom: 32px;
          line-height: 1.5;
        }
        .button { 
          display: inline-block; 
          background: #1f2937; 
          color: white; 
          text-decoration: none; 
          padding: 14px 28px; 
          border-radius: 8px; 
          font-weight: 600; 
          font-size: 16px;
          margin: 24px 0; 
          transition: all 0.3s ease;
        }
        .button:hover { 
          background: #374151;
        }
        .info-card { 
          background: #f9fafb; 
          padding: 24px; 
          border-radius: 12px; 
          margin: 24px 0; 
          border-left: 4px solid #1f2937;
        }
        .highlight-box { 
          background: #fef3c7; 
          padding: 20px; 
          border-radius: 8px; 
          margin: 24px 0; 
          border-left: 4px solid #f59e0b;
        }
        .price-display { 
          font-size: 32px; 
          font-weight: 800; 
          color: #10b981; 
          text-align: center; 
          margin: 20px 0;
        }
        .domain-name { 
          font-size: 20px; 
          font-weight: 700; 
          color: #1f2937; 
          text-align: center; 
          margin: 16px 0;
        }
        .details-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 24px 0;
          background: #f9fafb;
          border-radius: 8px;
          overflow: hidden;
        }
        .details-table td { 
          padding: 16px; 
          border-bottom: 1px solid #e5e7eb; 
          vertical-align: top;
        }
        .details-table td:first-child { 
          font-weight: 600; 
          color: #374151; 
          width: 40%;
          background: #f3f4f6;
        }
        .footer { 
          text-align: center; 
          padding: 32px; 
          background: #f3f4f6; 
          color: #6b7280; 
          font-size: 14px;
        }
        .social-links { 
          margin: 20px 0; 
        }
        .social-links a { 
          display: inline-block; 
          margin: 0 12px; 
          color: #1f2937; 
          text-decoration: none;
          font-weight: 500;
        }
        .divider { 
          height: 1px; 
          background: #e5e7eb; 
          margin: 32px 0;
        }
        .status-badge { 
          display: inline-block; 
          padding: 6px 12px; 
          border-radius: 20px; 
          font-size: 12px; 
          font-weight: 600; 
          text-transform: uppercase; 
          letter-spacing: 0.5px;
        }
        .status-success { 
          background: #d1fae5; 
          color: #065f46;
        }
        .status-warning { 
          background: #fef3c7; 
          color: #92400e;
        }
        .status-info { 
          background: #dbeafe; 
          color: #1e40af;
        }
      </style>
    `;
