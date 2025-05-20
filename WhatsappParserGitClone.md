//About Installation Whatsapp Parser by Gitclone instruction archive

>for whatsapp parser like installation problem occur and to resolve restriction (particularly: npm --version)

Prerequisites
Node.js and npm:
Install Node.js (version 16 or later recommended) and npm. Download from https://nodejs.org/ or use a package manager like nvm.
Verify installation:
bash
Copy
node --version npm --version
PS C:\Users\USER> node --version v22.15.1 PS C:\Users\USER> npm --version npm : 因為這個系統上已停用指令碼執行，所以無法載入 C:\Program Files\nodejs\npm.ps1 檔案。如需詳細資訊，請參閱 about_Exe cution_Policies，網址為 https:/go.microsoft.com/fwlink/?LinkID=135170。 位於 線路:1 字元:1 + npm --version + ~~~     + CategoryInfo          : SecurityError: (:) [], PSSecurityException     + FullyQualifiedErrorId : UnauthorizedAccess PS C:\Users\USER>
Steps to Fix
Open PowerShell as Administrator:
Right-click the Start menu → select Windows PowerShell (Admin) or Terminal (Admin).
Confirm the User Account Control (UAC) prompt if asked.
Running as admin is required to change the execution policy for the system or current user.
Check Current Execution Policy (optional):
Run:
powershell
Copy
Get-ExecutionPolicy
This will likely show Restricted, confirming the issue.
Set Execution Policy to RemoteSigned:
Run:
powershell
Copy
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
Explanation:
-Scope CurrentUser: Applies the policy only to your user account, avoiding system-wide changes (safer and usually sufficient).
-ExecutionPolicy RemoteSigned: Allows local scripts to run, which fixes the npm issue.
You may see a prompt asking for confirmation. Type Y and press Enter.
Verify the Change (optional):
Run:
powershell
Copy
Get-ExecutionPolicy
It should now show RemoteSigned.
Test npm:
Close and reopen PowerShell (no admin needed this time) to ensure the new policy is applied.
Run:
powershell
Copy
npm --version
You should see an output like 10.x.x (e.g., 10.8.3 for Node.js v22.15.1).
Git:
Ensure Git is installed. Download from https://git-scm.com/ or use a package manager.
Verify:
bash
CollapseWrapRun
Copy
git --version
Step-by-Step Instructions
Clone the Repository:
Open a terminal (or command prompt) and navigate to a directory where you want to store the project.
Run:
bash
Copy
git clone https://github.com/Pustur/whatsapp-chat-parser-website.git
This creates a folder named whatsapp-chat-parser-website.
Navigate into the project folder:
bash
Copy
cd whatsapp-chat-parser-website
Install Dependencies:
The project uses Node.js and npm to manage dependencies (React, whatsapp-chat-parser, etc.).
Run:
bash
Copy
npm install
This installs all required packages listed in package.json. It may take a few minutes.
Run the Development Server:
The project is a React app created with Create React App, so you can start it with:
bash
Copy
npm start
This launches a development server, and you should see output like:
text
Copy
Compiled successfully! You can now view whatsapp-chat-parser-website in the browser. Local:            http://localhost:3000
Your default browser should automatically open to http://localhost:3000. If not, open a browser and navigate to that URL.
