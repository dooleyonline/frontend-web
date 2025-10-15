"use client";

import StepVisualizer from "@/components/form/step-visualizer";
import { ItemModal } from "@/components/item";
import { Item } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, useFormState } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";

import { defaultFormValues, formSchema } from "./(form)/schema";
import Step1 from "./(form)/step-1";
import Step2 from "./(form)/step-2";
import Step3 from "./(form)/step-3";

const MarketplaceNew = () => {
  const [step, setStep] = useState(1);

  const form = useForm<
    z.input<typeof formSchema>,
    unknown,
    z.output<typeof formSchema>
  >({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...defaultFormValues,
    },
    mode: "onChange",
  });

  const { isDirty } = useFormState({ control: form.control });

  useEffect(() => {
    // Handle browser refresh/close
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  function onSubmit(values: unknown) {
    try {
      setStep((prev) => {
        if (prev === 3) {
          toast.success("Your item is successfully posted!", {
            description: new Date().toLocaleString(),
            action: {
              label: "View Item",
              onClick: () => console.log("Viewing Item"),
            },
          });
          console.log("Submitting form values:", values);

          form.reset();
          return 1;
        }

        return prev + 1;
      });
    } catch (error) {
      console.error("Form submission error", error);
      toast.error("Failed to submit the form. Please try again.");
    }
  }

  function onBack() {
    if (step > 1) {
      setStep((prev) => prev - 1);
    } else {
      toast.error("You are already on the first step.");
    }
  }

  const steps = [
    {
      title: "Basic Information",
      form: <Step1 form={form} onSubmit={onSubmit} />,
    },
    {
      title: "Condition & Price",
      form: <Step2 form={form} onSubmit={onSubmit} onBack={onBack} />,
    },
    {
      title: "Confirm",
      form: <Step3 form={form} onSubmit={onSubmit} onBack={onBack} />,
    },
  ];

  return (
    <main className="flex gap-6 w-full h-full">
      {/* FORM */}
      <div className="flex-2/3 flex flex-col gap-6">
        <StepVisualizer
          steps={steps.map((step) => step.title)}
          currentStep={step}
        />
        <h2>{steps[step - 1].title}</h2>
        {steps[step - 1].form}
      </div>

      {/* PREVIEW */}
      <div className="flex-1/3 hidden lg:block min-w-sm max-w-2xl p-6 border rounded-xl">
        <ItemModal
          item={
            {
              ...form.watch(),
              price: Number(form.watch("price")) || 0,
              condition: Number(form.watch("condition")) || 0,
              id: -1,
              postedAt: new Date(),
              soldAt: null,
              // isSold: false,
              isNegotiable: form.watch("negotiable") || false,
              views: 112,
              // seller: "John Doe",
              category: form.watch("category"),
              subcategory: form.watch("subcategory"),
              // TODO: temporary src
              images: form.watch("images").map(() => "/images/fallback.png"),
              // .map((img) => URL.createObjectURL(img as File)),
            } satisfies Item
          }
          isPreview
        />
      </div>
    </main>
  );
};

export default MarketplaceNew;
