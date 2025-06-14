
export const emailStyles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          line-height: 1.6; 
          color: #1a1a1a; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 40px 20px;
        }
        .email-container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: #ffffff; 
          border-radius: 24px; 
          overflow: hidden; 
          box-shadow: 0 25px 50px rgba(0,0,0,0.15);
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          padding: 48px 32px; 
          text-align: center; 
          position: relative;
        }
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="1" fill="white" opacity="0.05"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
          pointer-events: none;
        }
        .logo { 
          color: white; 
          font-size: 32px; 
          font-weight: 800; 
          margin-bottom: 8px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
          position: relative;
          z-index: 1;
        }
        .tagline { 
          color: rgba(255,255,255,0.9); 
          font-size: 16px; 
          font-weight: 500;
          position: relative;
          z-index: 1;
        }
        .content { 
          padding: 48px 32px; 
          background: #ffffff;
        }
        .title { 
          font-size: 28px; 
          font-weight: 700; 
          color: #1a1a1a; 
          margin-bottom: 16px;
          line-height: 1.3;
        }
        .subtitle { 
          font-size: 18px; 
          color: #6b7280; 
          margin-bottom: 32px;
          line-height: 1.5;
        }
        .button { 
          display: inline-block; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          color: white; 
          text-decoration: none; 
          padding: 16px 32px; 
          border-radius: 12px; 
          font-weight: 600; 
          font-size: 16px;
          margin: 24px 0; 
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        .button:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
        }
        .info-card { 
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); 
          padding: 24px; 
          border-radius: 16px; 
          margin: 24px 0; 
          border-left: 4px solid #667eea;
        }
        .highlight-box { 
          background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%); 
          padding: 20px; 
          border-radius: 12px; 
          margin: 24px 0; 
          border-left: 4px solid #f59e0b;
        }
        .price-display { 
          font-size: 36px; 
          font-weight: 800; 
          color: #059669; 
          text-align: center; 
          margin: 20px 0;
          text-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);
        }
        .domain-name { 
          font-size: 24px; 
          font-weight: 700; 
          color: #1e40af; 
          text-align: center; 
          margin: 16px 0;
        }
        .details-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 24px 0;
        }
        .details-table td { 
          padding: 12px 16px; 
          border-bottom: 1px solid #e5e7eb; 
          vertical-align: top;
        }
        .details-table td:first-child { 
          font-weight: 600; 
          color: #4b5563; 
          width: 40%;
        }
        .footer { 
          text-align: center; 
          padding: 32px; 
          background: #f8fafc; 
          color: #6b7280; 
          font-size: 14px;
        }
        .social-links { 
          margin: 20px 0; 
        }
        .social-links a { 
          display: inline-block; 
          margin: 0 8px; 
          color: #667eea; 
          text-decoration: none;
        }
        .divider { 
          height: 1px; 
          background: linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%); 
          margin: 32px 0;
        }
        .status-badge { 
          display: inline-block; 
          padding: 8px 16px; 
          border-radius: 20px; 
          font-size: 14px; 
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
