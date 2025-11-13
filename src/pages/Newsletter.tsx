import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import PortfolioHeader from "@/components/PortfolioHeader";
import PortfolioFooter from "@/components/PortfolioFooter";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const newsletterSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255, { message: "Email must be less than 255 characters" }),
});

type NewsletterFormValues = z.infer<typeof newsletterSchema>;

const Newsletter = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<NewsletterFormValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: NewsletterFormValues) => {
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Successfully subscribed",
        description: "Thank you for subscribing to the newsletter.",
      });
      form.reset();
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <>
      <SEO
        title="Newsletter - Morgan Blake"
        description="Subscribe to Morgan Blake's newsletter for updates on new projects and photography insights."
        canonicalUrl="/newsletter"
      />

      <PortfolioHeader
        activeCategory=""
      />
      
      <main className="min-h-screen">
        <section className="max-w-[1600px] mx-auto px-3 md:px-5 pt-20 pb-12 md:pt-24 md:pb-16">
          <div className="text-center space-y-4 mb-12">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-inter">
              UPDATES
            </p>
            <h1 className="font-playfair text-4xl md:text-5xl text-foreground">
              Newsletter
            </h1>
            <p className="text-foreground/80 text-sm leading-relaxed max-w-md mx-auto">
              Updates on new projects and photography insights.
            </p>
          </div>

          <div className="max-w-md mx-auto space-y-8 text-center">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="Enter your email address" 
                          className="border-0 border-b border-foreground/20 rounded-none bg-transparent text-foreground text-center h-12 px-0 focus-visible:ring-0 focus-visible:border-foreground placeholder:text-foreground/40 transition-colors"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-center" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  variant="outline"
                  className="w-full md:w-auto px-12 py-6 text-sm uppercase tracking-widest font-inter border-foreground/40 hover:bg-foreground hover:text-background transition-all"
                >
                  {isSubmitting ? "Subscribing..." : "Subscribe"}
                </Button>
              </form>
            </Form>

            <p className="text-xs text-muted-foreground">
              Unsubscribe at any time.
            </p>
          </div>
        </section>
      </main>

      <PortfolioFooter />
    </>
  );
};

export default Newsletter;
