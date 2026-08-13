import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

export const USER_ROLES = ["admin", "staff"] as const;
export type UserRole = (typeof USER_ROLES)[number];

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // excluded from queries by default — must opt in with .select("+passwordHash")
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: "staff",
    },
  },
  { timestamps: true }
);

export type UserAttrs = InferSchemaType<typeof userSchema>;
export type UserDocument = HydratedDocument<UserAttrs>;

/** The subset of a user document that's ever safe to send to the client — never passwordHash. */
export function toPublicUser(user: UserDocument) {
  return {
    id: user._id.toString(),
    username: user.username,
    role: user.role as UserRole,
    createdAt: user.createdAt as Date,
  };
}

export const User = model("User", userSchema);
