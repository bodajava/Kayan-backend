

export const emailTemplet = async ({ code, title } : {code:number , title : string}) => {

    return `
  <!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f5f5f7;
            margin: 0;
            padding: 0;
        }

        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        }

        .header {
            padding: 30px;
            text-align: center;
            border-bottom: 1px solid #e5e5e5;
        }

        .header h1 {
            margin: 0;
            font-size: 20px;
            font-weight: 600;
            color: #1d1d1f;
            letter-spacing: 0.5px;
        }

        .content {
            padding: 40px 30px;
            color: #1d1d1f;
        }

        .content h2 {
            font-size: 22px;
            font-weight: 600;
            margin-bottom: 10px;
        }

        .content p {
            font-size: 15px;
            line-height: 1.7;
            color: #6e6e73;
        }

        .code-box {
            margin: 30px 0;
            padding: 18px;
            text-align: center;
            font-size: 28px;
            letter-spacing: 8px;
            font-weight: 600;
            color: #1d1d1f;
            background-color: #f5f5f7;
            border-radius: 12px;
            border: 1px solid #e5e5e5;
        }

        .footer {
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #86868b;
            border-top: 1px solid #e5e5e5;
        }

        .note {
            margin-top: 20px;
            font-size: 13px;
            color: #86868b;
        }
    </style>
</head>

<body>
    <div class="container">

        <div class="header">
            <h1>SARAHA APP</h1>
        </div>

        <div class="content">
            <h2>${title || "Verification Code"}</h2>

            <p>Hello,</p>

            <p>
                Use the code below to continue your action.  
                This code is valid for a short time for your security.
            </p>

            <div class="code-box">
                ${code}
            </div>

            <p class="note">
                If you didn’t request this code, you can safely ignore this email.
            </p>
        </div>

        <div class="footer">
            © 2025 SARAHA APP — All rights reserved
        </div>

    </div>
</body>
</html>`
}