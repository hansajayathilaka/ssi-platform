import { NextFunction, Request, Response } from "express";
import { ISSUER_NAME } from "../consts";
import { getOobi } from "../utils/utils";
import { SignifyClient } from "signify-ts";

export async function keriOobiApi(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const client: SignifyClient = req.app.get("signifyClient");

  if (!client) {
    res.status(503).send({
      success: false,
      error: {
        code: "CLIENT_NOT_READY",
        message:
          "Signify client is not yet initialized. Please wait a moment and try again.",
      },
    });
    return;
  }

  try {
    const url = `${await getOobi(
      client,
      ISSUER_NAME
    )}?name=CF%20Credential%20Issuance`;
    res.status(200).send({
      success: true,
      data: url,
    });
  } catch (error) {
    console.error("Error getting OOBI:", error);
    res.status(500).send({
      success: false,
      error: {
        code: "OOBI_ERROR",
        message: "Failed to get OOBI",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}
