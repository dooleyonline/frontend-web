"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { MouseEventHandler } from "react";
import { useFormContext } from "react-hook-form";

type Step2Props = {
  handleNext: MouseEventHandler<HTMLButtonElement>;
  handleBack: MouseEventHandler<HTMLButtonElement>;
};

export const Step2 = ({ handleNext, handleBack }: Step2Props) => {
  const form = useFormContext();

  return (
    <div className="flex flex-col gap-8 grow">
      <FormField
        control={form.control}
        name="condition"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Condition</FormLabel>
            <FormControl>
              <Slider
                id="condition"
                min={0}
                max={5}
                step={1}
                onValueChange={(vals) => field.onChange(vals[0])}
              />
            </FormControl>
            <FormDescription className="text-sm text-muted-foreground flex justify-between">
              {["Poor", "Fair", "Good", "Very Good", "Like New", "New"].map(
                (label, index) => (
                  <span
                    key={label}
                    className={`w-0 flex ${index === 0 ? "justify-start" : index === 5 ? "justify-end" : "justify-center"}`}
                  >
                    <span className="text-nowrap block">{label}</span>
                  </span>
                )
              )}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="price"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Price ($)</FormLabel>
            <FormControl>
              <Input
                id="price"
                placeholder="0.00"
                type="number"
                inputMode="numeric"
                {...field}
                onChange={(e) => {
                  const numeric = parseFloat(e.target.value);
                  form.setValue("price", numeric);
                }}
              />
            </FormControl>
            <FormDescription>
              Enter the price without the dollar sign (e.g., for $10, enter 10.)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="isNegotiable"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Label className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-blue-600 dark:has-[[aria-checked=true]]:border-blue-900">
                <Checkbox
                  id="negotiable"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:border-blue-600 dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
                />
                <div className="flex flex-col gap-1">
                  <FormLabel>Price is negotiable</FormLabel>
                  <FormDescription>
                    Check this box if you are open to offers or negotiations on
                    the price.
                  </FormDescription>
                </div>
              </Label>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex gap-2 self-end grow items-end">
        <Button type="button" variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button onClick={handleNext}>Continue</Button>
      </div>
    </div>
  );
};
