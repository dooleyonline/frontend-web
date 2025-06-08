"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useForm } from "react-hook-form";

import { FormValues } from "./schema";

type Step3Props = {
  form: ReturnType<typeof useForm<FormValues>>;
  onSubmit: (values: FormValues) => void;
  onBack: () => void;
};

export default function Step3(props: Step3Props) {
  const { form, onSubmit, onBack } = props;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-8 grow"
      >
        <Table>
          <TableCaption>Review your item details.</TableCaption>
          <TableHeader>
            <TableRow className="font-semibold">
              <TableCell>Field</TableCell>
              <TableCell className="text-right">Value</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(form.getValues()).map(([key, value]) => (
              <TableRow key={key}>
                <TableCell className="align-top">
                  {key.slice(0, 1).toUpperCase() + key.slice(1)}
                </TableCell>
                <TableCell className="text-right whitespace-pre">
                  {typeof value === "object"
                    ? value.map((f: File) => f.name).join("\n")
                    : value.toString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex gap-2 self-end grow items-end">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button type="submit">Post</Button>
        </div>
      </form>
    </Form>
  );
}
