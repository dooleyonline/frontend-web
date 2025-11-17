"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/ui/loading-button";
import { useUser } from "@/hooks/use-user";
import api from "@/lib/api";
import { serverQuery } from "@/lib/api/shared";
import { SignUp, signUpSchema } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const SignUpPage = () => {
  const router = useRouter();
  const { user, revalidate } = useUser();
  const form = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const handleSignUp = async (params: SignUp) => {
    const { error } = await serverQuery(api.auth.signUp(params));
    if (error) {
      toast.error("Failed to sign up", {
        description: "Please try again later",
      });
      return;
    }
    // TODO: email verification
    await serverQuery(api.auth.signIn(params));
    await revalidate();
    router.replace("/");
  };

  return (
    <main className="flex items-center justify-center h-full relative">
      <div className="absolute top-0 left-0 size-full bg-center bg-cover bg-[url(/images/0.webp)] mask-size-[100px_100px] mask-[url(/noise.webp)]"></div>
      <div className="w-full max-w-xl relative">
        <h2 className="text-4xl font-display">Welcome!</h2>
        <div className="p-4 mt-2">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSignUp)}
              className="space-y-6"
            >
              <div className="flex *:flex-1 gap-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" type="text" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" type="text" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="name@emory.edu"
                        type="text"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="********"
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <LoadingButton
                type="submit"
                disabled={user !== null || !form.formState.isValid}
                isLoading={form.formState.isSubmitting}
                className="w-full"
              >
                {user ? `Signed in as ${user.email}` : "Sign Up"}
              </LoadingButton>
            </form>
          </Form>

          <p className="mt-4 text-sm text-center">
            Already have an account?{" "}
            <Link
              href="/auth/sign-in"
              className="font-medium underline text-primary"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};

export default SignUpPage;
