type VerifiableUser =
    | {
          role?: string | null;
          is_verified?: boolean | null;
      }
    | null
    | undefined;

export function isVerifiedTeacher(user: VerifiableUser): boolean {
    return (
        (user?.role ?? '').toString().toLowerCase() === 'teacher' &&
        Boolean(user?.is_verified)
    );
}
