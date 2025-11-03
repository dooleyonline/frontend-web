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
import { SignIn } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const SignInPage = () => {
  const router = useRouter();
  const { user, revalidate } = useUser();
  const form = useForm<SignIn>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSignIn = async (params: SignIn) => {
    const { error } = await serverQuery(api.auth.signIn(params));
    if (error) {
      toast.error("Failed to sign in", {
        description: "Please try again later",
      });
    }
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
              onSubmit={form.handleSubmit(handleSignIn)}
              className="space-y-6"
            >
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
                {user ? `Signed in as ${user.email}` : "Sign In"}
              </LoadingButton>
            </form>
          </Form>
        </div>
      </div>
    </main>
  );
};

export default SignInPage;
