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
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
	email: z.email({
		pattern: new RegExp(/.+@(alumni\.)?emory\.edu/),
		error: "Email must be a valid Emory email",
	}),
	password: z.string().min(1, "Password is required"),
});

const SignInPage = () => {
	const router = useRouter();
	const { user, revalidate } = useUser();
	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const handleSignIn = async () => {
		const values = form.getValues();
		const { data: userData, error: userError } = await serverQuery(
			api.auth.signIn(values.email, values.password),
		);
		if (!userData || userError) {
			toast.error("Failed to sign in", {
				description: "Please try again later",
			});
			return;
		}
		await revalidate();
		if (userData.verified) {
			router.push("/");
			return;
		}

		const { data: verifyData, error: verifyError } = await serverQuery(
			api.auth.sendVerification(userData.id, userData.email),
		);
		if (verifyError) {
			toast.error("Failed to send verification email", {
				description: "Please try again later",
			});
			return;
		}

		if (userData) {
			toast.success("Verification email sent!", {
				description: values.email,
			});
			router.push(`/auth/verify?id=${verifyData}`);
		}
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
										<Input
											placeholder="Enter your password"
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

				<p className="mt-4 text-sm text-center">
					Don&apos;t have an account?{" "}
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
