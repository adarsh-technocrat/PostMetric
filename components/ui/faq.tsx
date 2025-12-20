"use client";

import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface FAQItem {
  id: string;
  question: string;
  answer: React.ReactNode;
}

interface FAQProps {
  items: FAQItem[];
  title?: string;
  className?: string;
  itemClassName?: string;
}

export function FAQ({
  items,
  title = "FAQ",
  className = "",
  itemClassName = "",
}: FAQProps) {
  return (
    <section className={`mt-24 ${className}`} id="faq">
      <div className="mx-auto max-w-2xl px-4">
        <h2 className="mb-8 text-2xl font-bold tracking-tight">{title}</h2>
        <Accordion type="single" collapsible className="space-y-3">
          {items.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className={`custom-card rounded-lg border border-stone-200 bg-white shadow-sm ${itemClassName}`}
            >
              <AccordionTrigger className="px-4 py-3 text-left font-medium">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-0">
                <div className="space-y-2 leading-relaxed text-muted-foreground">
                  {item.answer}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
