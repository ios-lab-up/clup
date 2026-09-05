import { SignIn } from "@clerk/nextjs";

export const metadata = { title: "Iniciar sesión • CLUP" };

export default function SignInPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-4 py-12">
      <SignIn
        appearance={{
          elements: {
            card: "shadow-lg rounded-xl",
            formButtonPrimary: "bg-wine-700 hover:bg-wine-800",
          },
        }}
      />
    </div>
  );
}
