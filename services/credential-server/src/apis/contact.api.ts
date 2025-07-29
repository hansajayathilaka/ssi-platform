import { NextFunction, Request, Response } from "express";
import { SignifyClient } from "signify-ts";

export async function contactList(
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
    // @TODO - foconnor: Temporary hack to add createdAt after one-way scan, doing this now
    // to avoid updating keripy and making a change which might make backwards compatability or migrations harder later.
    const contacts = await client.contacts().list();
    for (const contact of contacts) {
      if (!contact.createdAt) {
        contact.createdAt = new Date();
        client.contacts().update(contact.id, {
          createdAt: contact.createdAt,
        });
      }
    }

    res.status(200).send({
      success: true,
      data: contacts,
    });
  } catch (error) {
    console.error("Error getting contacts:", error);
    res.status(500).send({
      success: false,
      error: {
        code: "CONTACTS_ERROR",
        message: "Failed to get contacts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}

export async function deleteContact(
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

  const { id } = req.query;

  try {
    const data = await client.contacts().delete(id as string);
    res.status(200).send({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error deleting contact:", error);
    res.status(500).send({
      success: false,
      error: {
        code: "DELETE_CONTACT_ERROR",
        message: "Failed to delete contact",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}
