"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api/shared";
import { SignIn, User, signInSchema, userSchema } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const SignInPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const form = useForm<SignIn>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const getAuthStatus = async () => {
    const url = "auth";
    try {
      const res = await apiClient.get(url);
      const { data } = await userSchema.nullable().safeParseAsync(res.data);
      console.log(data);
      if (data) setUser(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    void getAuthStatus();
  }, []);

  const handleSignIn = async (values: SignIn) => {
    const url = "auth/login";
    const res = await apiClient.post(url, values);
    const { data, error } = await userSchema.safeParseAsync(res.data);
    if (error) console.error(error);
    if (data) setUser(data);
  };

  const handleSignOut = async () => {
    const url = "auth/logout";
    await apiClient.post(url);
    setUser(null);
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>
            Enter your email below to sign in to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                        placeholder="name@example.com"
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
              <Button type="submit" disabled={user !== null} className="w-full">
                {user ? `Signed in as ${user.email}` : "Sign In"}
              </Button>
            </form>
          </Form>
          <Button
            type="submit"
            onClick={handleSignOut}
            disabled={user === null}
            variant="secondary"
            className="w-full mt-2"
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignInPage;
