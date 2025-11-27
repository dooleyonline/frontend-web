"use client";

import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const VerifyPage = ({}: PageProps<"/auth/verify">) => {
	return (
		<section className="w-lg">
			<Suspense>
				<VerificationMessage />
			</Suspense>
			<Link href="/">
				<Button variant="secondary" className="mt-4">
					Return home
				</Button>
			</Link>
		</section>
	);
};

export default VerifyPage;

const VerificationMessage = () => {
	const searchParams = useSearchParams();
	const id = searchParams.get("id");
	const token = searchParams.get("token");

	const { data: verificationData } = useQuery({
		...api.auth.getVerification(id ?? ""),
		enabled: !!id,
	});
	const { data: userData } = useQuery({
		...api.user.get(verificationData?.userID ?? ""),
		enabled: !!verificationData,
	});
	const { data: verifyResultData } = useQuery({
		...api.auth.verify(id ?? "", token ?? ""),
		enabled: !!token && !!id,
	});

	// invalid
	if (!verificationData || (token && !verifyResultData)) {
		return (
			<>
				<h2 className="text-4xl font-display mb-5">Invalid verification!</h2>
				<p className="text-destructive">Invalid ID or token.</p>
			</>
		);
	}

	// verification success
	if (verifyResultData) {
		return (
			<>
				<h2 className="text-4xl font-display mb-5">
					Email verified successfully!
				</h2>
				<p className="text-muted-foreground">
					Now you can sign in and fully enjoy DooleyOnline.
				</p>
			</>
		);
	}

	// info
	return (
		<>
			<h2 className="text-4xl font-display mb-5">Verification sent!</h2>
			<p className="text-muted-foreground">
				A verification link has been sent to {userData?.email}.
				<br />
				The link expires in 10 minutes.
			</p>
		</>
	);
};
