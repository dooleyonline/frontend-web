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
import { motion } from "motion/react";
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
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-lg"
    >
      <h2 className="text-4xl font-display mb-5">Welcome!</h2>
      <div>
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
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" type="text" {...field} />
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
                      placeholder="john.doe@emory.edu"
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
              {user ? `Signed in as ${user.email}` : "Sign Up"}
            </LoadingButton>
          </form>
        </Form>

        <p className="mt-4 text-sm text-center">
          Already have an account?{" "}
          <Link
            href="/auth/sign-in"
            className="font-medium hover:underline text-primary"
          >
            Sign in
          </Link>
        </p>
      </div>
    </motion.section>
  );
};

export default SignUpPage;
