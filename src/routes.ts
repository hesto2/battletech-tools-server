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
const BUCKET_NAME = 'battletech-user-data';

router.get('/oauthredirect', async (req: Request, res: Response) => {
  try {
    const client = getAuthenticatedClient();
    const { tokens } = await client.getToken(req.query.code as string);
    client.setCredentials(tokens);
    const { refresh_token, access_token } = tokens;
    const queryVars: any = {
      access_token,
      refresh_token,
    };
    const queryString = Object.keys(queryVars)
      .map(
        (key) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(queryVars[key])}`
      )
      .join('&');

    res.redirect(
      `${process.env.APPLICATION_ROOT_URL}/oauthredirect?${queryString}`
    );
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

router.get('/oauth/token', async (req: Request, res: Response) => {
  try {
    const client = getAuthenticatedClient();
    const { tokens } = await client.getToken(req.query.code as string);
    client.setCredentials(tokens);
    res.status(200).json(tokens);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

router.get('/oauth/refresh', async (req: Request, res: Response) => {
  try {
    const client = getAuthenticatedClient();
    client.setCredentials({
      refresh_token: req.query.refresh_token as string,
    });
    const { credentials } = await client.refreshAccessToken();
    res.status(200).json(credentials);
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

    const { email } = await authenticateUser(token);

    const params = {
      Bucket: BUCKET_NAME,
      Key: email,
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

const authenticateUser = async (token: string): Promise<{ email: string }> => {
  const oAuth2Client = getAuthenticatedClient();
  const ticket = await oAuth2Client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_OAUTH_CLIENT_ID,
  });
  const payload = ticket.getPayload();

  return { email: payload.email };
};

router.get('/config', async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;

    const { email } = await authenticateUser(token);

    const params = {
      Bucket: BUCKET_NAME,
      Key: email,
    };

    const data = await s3.getObject(params).promise();
    const config = JSON.parse(data.Body.toString());

    res.status(200).json(config);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;

    const { email } = await authenticateUser(token);

    res.status(200).json({ email });
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

export default router;
