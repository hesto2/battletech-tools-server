/**
 * Main application routes
 */

'use strict';
import { Router, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { S3 } from 'aws-sdk';
const s3 = new S3();

const router = Router();

router.get('/oauthredirect', async (req: Request, res: Response) => {
  try {
    const client = getAuthenticatedClient();
    const result = await client.getToken(req.query.code as string);
    client.setCredentials(result.tokens);

    res.redirect(
      `${
        process.env.APPLICATION_ROOT_URL
      }/oauthredirect?tokens=${JSON.stringify(
        result.tokens
      )}&email=${await getUserEmail(client)}`
    );
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});
router.get('/oauth/login', async (req: Request, res: Response) => {
  const oAuth2Client = getAuthenticatedClient();
  res.redirect(
    oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/userinfo.email'],
    })
  );
});

router.get('/refresh_token', async (req: Request, res: Response) => {
  try {
    const oAuth2Client = getAuthenticatedClient();
    oAuth2Client.setCredentials({
      refresh_token: req.query.refresh_token as string,
    });

    const newTokens = await oAuth2Client.refreshAccessToken();
    res.status(200).json(newTokens.credentials);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

router.post('/config', async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;
    const payload = req.body;

    const oAuth2Client = getAuthenticatedClient();
    oAuth2Client.setCredentials({ access_token: token });

    const userEmail = await getUserEmail(oAuth2Client);

    const params = {
      Bucket: 'battletech_user_data',
      Key: userEmail,
      Body: JSON.stringify(payload),
      ContentType: 'application/json',
    };

    await s3.putObject(params).promise();

    res.status(200).send();
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

router.get('/config', async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;

    const oAuth2Client = getAuthenticatedClient();
    oAuth2Client.setCredentials({ access_token: token });

    const userEmail = await getUserEmail(oAuth2Client);

    const params = {
      Bucket: 'battletech_user_data',
      Key: userEmail,
    };

    const data = await s3.getObject(params).promise();
    const config = JSON.parse(data.Body.toString());

    res.status(200).json(config);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

const getAuthenticatedClient = () => {
  const oAuth2Client = new OAuth2Client(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT_URI
  );
  return oAuth2Client;
};

const getUserEmail = async (oAuth2Client: OAuth2Client) => {
  const oauth2 = google.oauth2({ version: 'v2', auth: oAuth2Client });
  const userInfo = await oauth2.userinfo.get();
  return userInfo.data.email;
};

export default router;
