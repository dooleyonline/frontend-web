"use client";

import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MouseEventHandler } from "react";
import { useFormContext } from "react-hook-form";

type Step3Props = {
  handleBack: MouseEventHandler<HTMLButtonElement>;
};

export default function Step3({ handleBack }: Step3Props) {
  const form = useFormContext();

  return (
    <div className="flex flex-col gap-8 grow">
      <Table>
        <TableCaption>Review your item details.</TableCaption>
        <TableHeader>
          <TableRow className="font-semibold">
            <TableCell>Field</TableCell>
            <TableCell className="text-right">Value</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(form.getValues())
            .filter(([key]) => key != "images")
            .map(([key, value]) => (
              <TableRow key={key}>
                <TableCell className="align-top">
                  {key.slice(0, 1).toUpperCase() + key.slice(1)}
                </TableCell>
                <TableCell className="text-right whitespace-pre">
                  {String(value)}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      <div className="flex gap-2 self-end grow items-end">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        <LoadingButton type="submit" isLoading={form.formState.isSubmitting}>
          Post
        </LoadingButton>
      </div>
    </div>
  );
}
