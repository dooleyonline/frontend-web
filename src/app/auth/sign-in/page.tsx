"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { apiClient } from "@/lib/api/shared";
import { SignIn, User, signInSchema, userSchema } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const SignInPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const me = useQuery(api.auth.me());
  const queryClient = useQueryClient();
  const form = useForm<SignIn>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (me.error) console.error(me.error);
    setUser(me.data ?? null);
    console.log(me.data);
  }, [me]);

  const handleSignIn = useCallback(async (params: SignIn) => {
    console.log("logging in");
    const res = await queryClient.fetchQuery(api.auth.signIn(params));
    setUser(res ?? null);
  }, []);

  console.log(user)

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
              <Button
                type="submit"
                disabled={user !== null || !form.formState.isValid}
                className="w-full"
              >
                {user ? `Signed in as ${user.email}` : "Sign In"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </main>
  );
};

export default SignInPage;
