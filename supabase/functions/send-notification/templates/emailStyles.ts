
export const emailStyles = `
<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #1f2937;
    background-color: #f8fafc;
  }
  
  .email-container {
    max-width: 600px;
    margin: 0 auto;
    background-color: #ffffff;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }
  
  .header {
    background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
    color: white;
    padding: 40px 32px;
    text-align: center;
    position: relative;
  }
  
  .header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #f59e0b, #ef4444, #8b5cf6, #06b6d4, #10b981);
  }
  
  .logo {
    font-size: 36px;
    font-weight: bold;
    margin-bottom: 12px;
    letter-spacing: 3px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  
  .tagline {
    font-size: 16px;
    opacity: 0.95;
    font-weight: 400;
    letter-spacing: 0.5px;
  }
  
  .content {
    padding: 48px 32px;
    background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
  }
  
  .title {
    color: #1f2937;
    font-size: 32px;
    font-weight: bold;
    margin-bottom: 20px;
    text-align: center;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  .subtitle {
    color: #4b5563;
    font-size: 18px;
    text-align: center;
    margin-bottom: 32px;
    font-weight: 500;
  }
  
  .button {
    display: inline-block;
    background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
    color: white !important;
    text-decoration: none;
    padding: 18px 36px;
    border-radius: 12px;
    font-weight: bold;
    font-size: 16px;
    text-align: center;
    transition: all 0.3s ease;
    box-shadow: 0 4px 16px rgba(31, 41, 55, 0.25);
    border: 2px solid transparent;
  }
  
  .button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(31, 41, 55, 0.35);
    border: 2px solid #f59e0b;
  }
  
  .info-card {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 28px;
    margin: 36px 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
  
  .info-card h3 {
    color: #1f2937;
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 18px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .highlight-box {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border: 2px solid #f59e0b;
    border-radius: 12px;
    padding: 24px;
    margin: 28px 0;
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);
  }
  
  .highlight-box p {
    color: #92400e;
    margin: 10px 0;
    font-weight: 500;
  }
  
  .divider {
    height: 2px;
    background: linear-gradient(90deg, #e5e7eb, #d1d5db, #e5e7eb);
    margin: 36px 0;
    border-radius: 1px;
  }
  
  .footer {
    background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
    padding: 36px 32px;
    text-align: center;
    border-top: 2px solid #e5e7eb;
  }
  
  .social-links {
    display: flex;
    justify-content: center;
    gap: 28px;
    margin-bottom: 28px;
    flex-wrap: wrap;
  }
  
  .social-links a {
    color: #6b7280;
    text-decoration: none;
    font-weight: 600;
    padding: 8px 16px;
    border-radius: 8px;
    transition: all 0.3s ease;
    border: 1px solid transparent;
  }
  
  .social-links a:hover {
    color: #1f2937;
    background-color: #ffffff;
    border: 1px solid #d1d5db;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .footer p {
    color: #6b7280;
    font-size: 14px;
    margin: 10px 0;
    font-weight: 500;
  }
  
  .footer a {
    color: #1f2937;
    text-decoration: none;
    font-weight: 600;
  }
  
  .footer a:hover {
    text-decoration: underline;
    color: #374151;
  }
  
  /* Brand Elements */
  .brand-accent {
    background: linear-gradient(90deg, #f59e0b, #ef4444, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  /* Responsive Design */
  @media (max-width: 600px) {
    .email-container {
      border-radius: 0;
      margin: 0;
    }
    
    .header {
      padding: 32px 20px;
    }
    
    .logo {
      font-size: 28px;
      letter-spacing: 2px;
    }
    
    .tagline {
      font-size: 14px;
    }
    
    .content {
      padding: 32px 20px;
    }
    
    .title {
      font-size: 26px;
    }
    
    .subtitle {
      font-size: 16px;
    }
    
    .footer {
      padding: 28px 20px;
    }
    
    .social-links {
      flex-direction: column;
      gap: 16px;
      align-items: center;
    }
    
    .social-links a {
      display: block;
      width: fit-content;
    }
    
    .button {
      display: block;
      margin: 20px auto;
      width: fit-content;
      min-width: 200px;
    }
    
    .info-card,
    .highlight-box {
      padding: 20px;
      margin: 24px 0;
    }
  }
</style>
`;
