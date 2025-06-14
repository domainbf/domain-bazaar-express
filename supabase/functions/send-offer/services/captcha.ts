
import { VerifyCaptchaResponse } from '../utils/types.ts';

export async function verifyCaptcha(token: string): Promise<boolean> {
  const secretKey = "0x0000000000000000000000000000000000000000"; // For testing only
  
  try {
    const response = await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${secretKey}&response=${token}`,
    });
    
    if (!response.ok) {
        console.error("hCaptcha API request failed:", response.status, await response.text());
        return false;
    }

    const data: VerifyCaptchaResponse = await response.json();
    return data.success;
  } catch (error) {
    console.error("Error verifying captcha:", error);
    return false;
  }
}
