"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
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

import { FormReturnType } from "./schema";

type Step2Props = {
  form: FormReturnType;
  onSubmit: (values: unknown) => void;
  onBack: () => void;
};

export default function Step2(props: Step2Props) {
  const { form, onSubmit, onBack } = props;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-8 grow"
      >
        <FormField
          control={form.control}
          name="condition"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Condition</FormLabel>
              <FormControl>
                <Slider
                  id="condition"
                  // defaultValue={[field.value]}
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
                  {...field} 
                  value={typeof field.value === 'number' ? field.value : ''} 
                />
              </FormControl>
              <FormDescription>
                Enter the price without the dollar sign (e.g., for $10, enter
                10.)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="negotiable"
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
                      Check this box if you are open to offers or negotiations
                      on the price.
                    </FormDescription>
                  </div>
                </Label>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 self-end grow items-end">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button type="submit">Continue</Button>
        </div>
      </form>
    </Form>
  );
}
