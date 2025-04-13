export const twoFactorAuthTemplate = `
<body style=" display: block; background: #F7F7FA;">
<table width="100%" style="background: #fff; max-width: 640px; margin: auto; border-top: 5px solid #2FB47C; padding: 48px;">
    <thead>
    <tr>
        <td style="padding-bottom: 56px;">

        </td>
    </tr>
    <tr>
        <td style="padding-bottom: 24px; font-size: 28px; color: #374072; font-weight: bold;">
            Two factor authentication
        </td>
    </tr>
    </thead>

    <tbody>
    <tr>
        <td style="font-weight: bold; font-size: 24px; color: #2FB47C; background-color: #F2F2F2; padding: 13px; display: flex; align-items: center; justify-content: center;">
            {{ message }}
        </td>
    </tr>
    <tr>
        <td style="padding-top: 24px; font-size: 18px; color: #646A86;">
            <p>
                Kindly use the code above to verify your login
            </p>
            <p>
                It will expire in 30 minutes:
            </p>
        </td>
    </tr>
    </tbody>
</table>
</body>`;

export const shopRequestDeniedTemplate = `
<body style=" display: block; background: #F7F7FA;">
<table width="100%" style="background: #fff; max-width: 640px; margin: auto; border-top: 5px solid #2FB47C; padding: 48px;">
    <thead>
    <tr>
        <td style="padding-bottom: 56px;">

        </td>
    </tr>
    <tr>
        <td style="padding-bottom: 24px; font-size: 28px; color: #374072; font-weight: bold;">
            Shop Request Update
        </td>
    </tr>
    </thead>

    <tbody>
    <tr>
        <td style="font-weight: bold; font-size: 24px; color: #2FB47C; background-color: #F2F2F2; padding: 13px; display: flex; align-items: center; justify-content: center;">
            {{ message }}
        </td>
    </tr>
    <tr>
        <td style="padding-top: 24px; font-size: 18px; color: #646A86;">
            <p>
                Reason for denial: {{ description }}
            </p>
        </td>
    </tr>
    </tbody>
</table>
</body>`;

export const shopRequestApprovedTemplate = `
<body style=" display: block; background: #F7F7FA;">
<table width="100%" style="background: #fff; max-width: 640px; margin: auto; border-top: 5px solid #2FB47C; padding: 48px;">
    <thead>
    <tr>
        <td style="padding-bottom: 56px;">

        </td>
    </tr>
    <tr>
        <td style="padding-bottom: 24px; font-size: 28px; color: #374072; font-weight: bold;">
        Shop Request Update
        </td>
    </tr>
    </thead>

    <tbody>
    <tr>
        <td style="font-weight: bold; font-size: 24px; color: #2FB47C; background-color: #F2F2F2; padding: 13px; display: flex; align-items: center; justify-content: center;">
            {{ message }}
        </td>
    </tr>

    </tbody>
</table>
</body>`;

export const productRequestDeniedTemplate = `
<body style=" display: block; background: #F7F7FA;">
<table width="100%" style="background: #fff; max-width: 640px; margin: auto; border-top: 5px solid #2FB47C; padding: 48px;">
    <thead>
    <tr>
        <td style="padding-bottom: 56px;">

        </td>
    </tr>
    <tr>
        <td style="padding-bottom: 24px; font-size: 28px; color: #374072; font-weight: bold;">
            Product Request Update
        </td>
    </tr>
    </thead>

    <tbody>
    <tr>
        <td style="font-weight: bold; font-size: 24px; color: #2FB47C; background-color: #F2F2F2; padding: 13px; display: flex; align-items: center; justify-content: center;">
            {{ message }}
        </td>
    </tr>
    <tr>
        <td style="padding-top: 24px; font-size: 18px; color: #646A86;">
            <p>
                Reason for denial: {{ description }}
            </p>
        </td>
    </tr>
    </tbody>
</table>
</body>`;

export const shopSuspendedTemplate = `
<body style=" display: block; background: #F7F7FA;">
<table width="100%" style="background: #fff; max-width: 640px; margin: auto; border-top: 5px solid #2FB47C; padding: 48px;">
    <thead>
    <tr>
        <td style="padding-bottom: 56px;">

        </td>
    </tr>
    <tr>
        <td style="padding-bottom: 24px; font-size: 28px; color: #374072; font-weight: bold;">
            Shop Suspension
        </td>
    </tr>
    </thead>

    <tbody>
    <tr>
        <td style="font-weight: bold; font-size: 24px; color: #2FB47C; background-color: #F2F2F2; padding: 13px; display: flex; align-items: center; justify-content: center;">
            {{ message }}
        </td>
    </tr>
    <tr>
        <td style="padding-top: 24px; font-size: 18px; color: #646A86;">
            <p>
                Reason for suspension: {{ description }}
            </p>
        </td>
    </tr>
    </tbody>
</table>
</body>`;

export const productRequestApprovedTemplate = `
<body style=" display: block; background: #F7F7FA;">
<table width="100%" style="background: #fff; max-width: 640px; margin: auto; border-top: 5px solid #2FB47C; padding: 48px;">
    <thead>
    <tr>
        <td style="padding-bottom: 56px;">

        </td>
    </tr>
    <tr>
        <td style="padding-bottom: 24px; font-size: 28px; color: #374072; font-weight: bold;">
        Product creation Request Update
        </td>
    </tr>
    </thead>

    <tbody>
    <tr>
        <td style="font-weight: bold; font-size: 24px; color: #2FB47C; background-color: #F2F2F2; padding: 13px; display: flex; align-items: center; justify-content: center;">
            {{ message }}
        </td>
    </tr>

    </tbody>
</table>
</body>`;

export const dealRequestTemplate = `
<body style=" display: block; background: #F7F7FA;">
<table width="100%" style="background: #fff; max-width: 640px; margin: auto; border-top: 5px solid #2FB47C; padding: 48px;">
    <thead>
    <tr>
        <td style="padding-bottom: 56px;">

        </td>
    </tr>
    <tr>
        <td style="padding-bottom: 24px; font-size: 28px; color: #374072; font-weight: bold;">
        Deal Finder
        </td>
    </tr>
    </thead>

    <tbody>
    <tr>
        <td style="font-weight: bold; font-size: 24px; color: #2FB47C; background-color: #F2F2F2; padding: 13px; display: flex; align-items: center; justify-content: center;">
            {{ message }}
        </td>
    </tr>

    </tbody>
</table>
</body>`;
