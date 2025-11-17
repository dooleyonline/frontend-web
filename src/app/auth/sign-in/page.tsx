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
import { SignIn, signInSchema } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const SignInPage = () => {
  const router = useRouter();
  const { user, revalidate } = useUser();
  const form = useForm({
    resolver: zodResolver(signInSchema),
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
      return;
    }
    await revalidate();
    router.replace("/");
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-lg"
    >
      <h2 className="text-4xl font-display mb-5">Welcome back!</h2>
      <div>
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
                    <Input placeholder="********" type="password" {...field} />
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

        <p className="mt-4 text-sm text-center">
          Don't have an account?{" "}
          <Link
            href="/auth/sign-up"
            className="font-medium hover:underline text-primary"
          >
            Sign up
          </Link>
        </p>
      </div>
    </motion.section>
  );
};

export default SignInPage;
