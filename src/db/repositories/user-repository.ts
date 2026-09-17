import { and, eq, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { users } from "../schema";
import type * as schema from "../schema";

type Database = NodePgDatabase<typeof schema>;

export interface Auth0Identity {
  subject: string;
  email: string;
  displayName: string;
}

export class UserIdentityConflictError extends Error {
  constructor() {
    super("The verified email address is already linked to another user");
  }
}

/** Maps a verified external identity to exactly one local financial owner. */
export class UserRepository {
  constructor(private readonly db: Database) {}

  async findOrCreateFromAuth0(identity: Auth0Identity) {
    const [existingBySubject] = await this.db
      .select()
      .from(users)
      .where(eq(users.auth0Subject, identity.subject))
      .limit(1);

    if (existingBySubject) {
      const [emailOwner] = await this.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, identity.email))
        .limit(1);
      if (emailOwner && emailOwner.id !== existingBySubject.id) throw new UserIdentityConflictError();

      const [updated] = await this.db
        .update(users)
        .set({ email: identity.email, displayName: identity.displayName, updatedAt: sql`now()` })
        .where(and(eq(users.id, existingBySubject.id), eq(users.auth0Subject, identity.subject)))
        .returning();
      return updated ?? existingBySubject;
    }

    const [emailOwner] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, identity.email))
      .limit(1);
    if (emailOwner) throw new UserIdentityConflictError();

    const [created] = await this.db.insert(users).values({
      auth0Subject: identity.subject,
      email: identity.email,
      displayName: identity.displayName,
    }).returning();
    if (!created) throw new Error("Failed to create local user");
    return created;
  }
}
