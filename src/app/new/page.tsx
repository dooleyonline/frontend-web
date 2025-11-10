"use client";

import StepVisualizer from "@/components/form/step-visualizer";
import { ItemModal } from "@/components/item";
import { Form } from "@/components/ui/form";
import api from "@/lib/api";
import { serverQuery } from "@/lib/api/shared";
import { Item, ItemCreateSchema } from "@/lib/types";
import { useRouter } from "next/navigation";
import { MouseEventHandler, useEffect, useMemo, useState } from "react";
import { useForm, useFormState, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { Step1 } from "./(form)/step-1";
import { Step2 } from "./(form)/step-2";
import Step3 from "./(form)/step-3";
import { formSchema } from "./(form)/schema";

const MarketplaceNew = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [images, setImages] = useState<File[]>([]);

  const form = useForm<ItemCreateSchema>({
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      images: [],
      condition: 0,
      category: "",
      subcategory: "",
      isNegotiable: false,
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

  const handleSubmit = async (values: ItemCreateSchema) => {
    let allUploaded = true;

    images.forEach(async (img) => {
      const { data, error } = await serverQuery(api.item.uploadImage(img));
      if (error || !data) {
        allUploaded = false;
        return;
      }
      values.images.push(data);
    });

    if (!allUploaded) {
      toast.error("Something went wrong!", {
        description: "Please try again later",
      });
      return;
    }

    const { data, error } = await serverQuery(api.item.create(values));
    if (error) {
      toast.error("Something went wrong!", {
        description: "Please try again later",
      });
      return;
    }

    toast.success("Your item is successfully posted!", {
      description: new Date().toLocaleString(),
    });

    router.push(data ? `/item/${data.id}` : "/");

    form.reset();
  };

  const handleNext: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    setStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handleBack: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const steps = [
    {
      title: "Basic Information",
      form: (
        <Step1 handleNext={handleNext} images={images} setImages={setImages} />
      ),
    },
    {
      title: "Condition & Price",
      form: <Step2 handleNext={handleNext} handleBack={handleBack} />,
    },
    {
      title: "Confirm",
      form: <Step3 handleBack={handleBack} />,
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            {steps[step - 1].form}
          </form>
        </Form>
      </div>

      {/* PREVIEW */}
      <div className="flex-1/3 hidden lg:block min-w-sm max-w-2xl p-6 border rounded-xl">
        <ItemModal item={previewItem} isPreview />
      </div>
    </main>
  );
};

export default MarketplaceNew;
