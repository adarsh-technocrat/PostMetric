"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch } from "@/store/hooks";
import {
  updateWebsiteSettingsAndConfiguration,
  connectStripeRevenue,
  disconnectStripeRevenue,
} from "@/store/slices/websitesSlice";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PAYMENT_PROVIDERS = [
  {
    id: "stripe",
    label: "Stripe",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        className="size-3 md:size-4"
        fill="#5f6bea"
      >
        <path
          fillRule="evenodd"
          d="M111.328 15.602c0-4.97-2.415-8.9-7.013-8.9s-7.423 3.924-7.423 8.863c0 5.85 3.32 8.8 8.036 8.8 2.318 0 4.06-.528 5.377-1.26V19.22a10.246 10.246 0 0 1-4.764 1.075c-1.9 0-3.556-.67-3.774-2.943h9.497a39.64 39.64 0 0 0 .063-1.748zm-9.606-1.835c0-2.186 1.35-3.1 2.56-3.1s2.454.906 2.454 3.1zM89.4 6.712a5.434 5.434 0 0 0-3.801 1.509l-.254-1.208h-4.27v22.64l4.85-1.032v-5.488a5.434 5.434 0 0 0 3.444 1.265c3.472 0 6.64-2.792 6.64-8.957.003-5.66-3.206-8.73-6.614-8.73zM88.23 20.1a2.898 2.898 0 0 1-2.288-.906l-.03-7.2a2.928 2.928 0 0 1 2.315-.96c1.775 0 2.998 2 2.998 4.528.003 2.593-1.198 4.546-2.995 4.546zM79.25.57l-4.87 1.035v3.95l4.87-1.032z"
        />
        <path d="M74.38 7.035h4.87V24.04h-4.87z" />
        <path d="M69.164 8.47l-.302-1.434h-4.196V24.04h4.848V12.5c1.147-1.5 3.082-1.208 3.698-1.017V7.038c-.646-.232-2.913-.658-4.048 1.43zm-9.73-5.646L54.698 3.83l-.02 15.562c0 2.87 2.158 4.993 5.038 4.993 1.585 0 2.756-.302 3.405-.643v-3.95c-.622.248-3.683 1.138-3.683-1.72v-6.9h3.683V7.035h-3.683zM46.3 11.97c0-.758.63-1.05 1.648-1.05a10.868 10.868 0 0 1 4.83 1.25V7.6a12.815 12.815 0 0 0-4.83-.888c-3.924 0-6.557 2.056-6.557 5.488 0 5.37 7.375 4.498 7.375 6.813 0 .906-.78 1.186-1.863 1.186-1.606 0-3.68-.664-5.307-1.55v4.63a13.461 13.461 0 0 0 5.307 1.117c4.033 0 6.813-1.992 6.813-5.485 0-5.796-7.417-4.76-7.417-6.943zM13.88 9.515c0-1.37 1.14-1.9 2.982-1.9A19.661 19.661 0 0 1 25.6 9.876v-8.27A23.184 23.184 0 0 0 16.862.001C9.762.001 5 3.72 5 9.93c0 9.716 13.342 8.138 13.342 12.326 0 1.638-1.4 2.146-3.37 2.146-2.905 0-6.657-1.202-9.6-2.802v8.378A24.353 24.353 0 0 0 14.973 32C22.27 32 27.3 28.395 27.3 22.077c0-10.486-13.42-8.613-13.42-12.56z" />
      </svg>
    ),
  },
  {
    id: "other",
    label: "Other",
    icon: null,
  },
];

const CURRENCIES = [
  { value: "AED", label: "AED - United Arab Emirates Dirham (AED)" },
  { value: "AUD", label: "AUD - Australian Dollar (AU$)" },
  { value: "BRL", label: "BRL - Brazilian Real (R$)" },
  { value: "CAD", label: "CAD - Canadian Dollar (CA$)" },
  { value: "CHF", label: "CHF - Swiss Franc (CHF)" },
  { value: "CNY", label: "CNY - Chinese Yuan (CN¥)" },
  { value: "CZK", label: "CZK - Czech Republic Koruna (Kč)" },
  { value: "EUR", label: "EUR - Euro (€)" },
  { value: "GBP", label: "GBP - British Pound Sterling (£)" },
  { value: "HKD", label: "HKD - Hong Kong Dollar (HK$)" },
  { value: "IDR", label: "IDR - Indonesian Rupiah (Rp)" },
  { value: "INR", label: "INR - Indian Rupee (Rs)" },
  { value: "JPY", label: "JPY - Japanese Yen (¥)" },
  { value: "KRW", label: "KRW - South Korean Won (₩)" },
  { value: "PLN", label: "PLN - Polish Zloty (zł)" },
  { value: "SGD", label: "SGD - Singapore Dollar (S$)" },
  { value: "USD", label: "USD - US Dollar ($)" },
];

interface RevenueSettingsProps {
  website: {
    _id: string;
    domain?: string;
    name?: string;
    settings?: {
      currency?: string;
      timezone?: string;
      colorScheme?: string;
      nickname?: string;
      additionalDomains?: string[];
      publicDashboard?: {
        enabled: boolean;
        shareId?: string;
      };
    };
    paymentProviders?: {
      stripe?: {
        apiKey?: string;
        webhookSecret?: string;
        connected?: boolean;
      };
    };
  } | null;
  websiteId: string;
  onUpdate: () => void;
}

export function RevenueSettings({
  website,
  websiteId,
  onUpdate,
}: RevenueSettingsProps) {
  const dispatch = useAppDispatch();
  const [selectedProvider, setSelectedProvider] = useState("stripe");
  const [stripeApiKey, setStripeApiKey] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  useEffect(() => {
    if (website) {
      setCurrency((website.settings as any)?.currency || "USD");
    }
  }, [website]);

  const handleConnectStripe = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dispatch(
        connectStripeRevenue({ websiteId, apiKey: stripeApiKey }),
      ).unwrap();
      onUpdate();
      setStripeApiKey("");
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectStripe = async () => {
    setLoading(true);
    try {
      await dispatch(disconnectStripeRevenue(websiteId)).unwrap();
      onUpdate();
      setShowDisconnectDialog(false);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const isStripeConnected = !!website?.paymentProviders?.stripe?.connected;

  const handleSaveCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dispatch(
        updateWebsiteSettingsAndConfiguration({
          websiteId,
          updates: {
            settings: {
              ...website?.settings,
              currency,
            },
          },
        }),
      ).unwrap();
      onUpdate();
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-4">
      <Card className="custom-card">
        <CardHeader>
          <CardTitle>Payment providers</CardTitle>
          <CardDescription>
            Connect your payment provider to track revenue and link it to your
            marketing campaigns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700">
              Payment provider
            </label>
            <Select
              value={selectedProvider}
              onValueChange={setSelectedProvider}
            >
              <SelectTrigger className="w-full max-w-xs border-stone-200">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_PROVIDERS.flatMap((provider, index) => [
                  ...(index > 0
                    ? [
                        <SelectSeparator
                          key={`sep-${provider.id}`}
                          className="bg-stone-200"
                        />,
                      ]
                    : []),
                  <SelectItem key={provider.id} value={provider.id}>
                    <span className="flex items-center gap-2">
                      {provider.icon && (
                        <span className="shrink-0">{provider.icon}</span>
                      )}
                      {provider.label}
                    </span>
                  </SelectItem>,
                ])}
              </SelectContent>
            </Select>
          </div>

          {selectedProvider === "stripe" && (
            <div className="space-y-8 pt-6">
              {isStripeConnected ? (
                <div className="space-y-8 pt-6">
                  <div className="relative flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex size-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-5"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="mt-2 h-full w-0.5 bg-green-100" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <h2 className="custom-card-title flex items-center gap-1.5">
                        Stripe connected
                      </h2>
                      <Button
                        onClick={() => setShowDisconnectDialog(true)}
                        variant="ghost"
                        size="sm"
                        className="hover:bg-error/20 hover:text-error"
                        disabled={loading}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                          className="size-4"
                        >
                          <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                        </svg>
                        Disconnect
                      </Button>
                    </div>
                  </div>
                  <div className="relative flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex size-8 items-center justify-center rounded-full border-2 border-base-content/20 bg-base-100 text-base-content/40">
                        <span className="text-sm font-semibold">2</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="space-y-0.5">
                        <div className="custom-card-title flex items-center gap-1.5">
                          <span className="w-4">2.</span>
                          <span>Link with traffic</span>
                        </div>
                        <div className="text-base-secondary text-sm leading-relaxed">
                          Make revenue-driven decisions by linking your revenue
                          data with your traffic data.{" "}
                          <span className="inline-flex flex-row items-center gap-1">
                            <a
                              href="/docs/revenue-attribution/get-started"
                              className="peer link font-medium text-base-content hover:text-primary"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Get started here
                            </a>{" "}
                            (it takes 2 minutes).
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-semibold text-textPrimary">
                        <span className="w-4">1.</span>
                        <span>Connect Stripe</span>
                      </div>
                      <div className="text-sm text-textSecondary leading-relaxed pl-5">
                        Create a{" "}
                        <a
                          href="https://dashboard.stripe.com/apikeys/create?name=Postmetric&permissions%5B%5D=rak_charge_read&permissions%5B%5D=rak_subscription_read&permissions%5B%5D=rak_customer_read&permissions%5B%5D=rak_payment_intent_read&permissions%5B%5D=rak_checkout_session_read&permissions%5B%5D=rak_invoice_read&permissions%5B%5D=rak_webhook_write"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group link text-base-content hover:text-primary inline-flex items-center gap-1"
                        >
                          restricted API key
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                            className="inline size-3.5 -translate-x-px translate-y-px duration-200 group-hover:translate-x-0 group-hover:translate-y-0"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.22 11.78a.75.75 0 0 1 0-1.06L9.44 5.5H5.75a.75.75 0 0 1 0-1.5h5.5a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0V6.56l-5.22 5.22a.75.75 0 0 1-1.06 0Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </a>{" "}
                        (do not change any permissions) and paste the API key
                        below:
                      </div>
                    </div>
                    <form
                      className="space-y-2 pl-5"
                      onSubmit={handleConnectStripe}
                    >
                      <Input
                        required
                        autoComplete="off"
                        placeholder="rk_live_******************"
                        className="input input-sm input-bordered w-full placeholder:opacity-70"
                        type="text"
                        value={stripeApiKey}
                        onChange={(e) => setStripeApiKey(e.target.value)}
                      />
                      <Button
                        type="submit"
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        disabled={loading}
                      >
                        Connect
                      </Button>
                    </form>
                  </div>

                  <div className="space-y-4 opacity-50">
                    <div className="space-y-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-semibold text-textPrimary">
                          <span className="w-4">2.</span>
                          <span>Link with traffic</span>
                        </div>
                        <div className="text-sm text-textSecondary leading-relaxed pl-5">
                          Make revenue-driven decisions by linking your revenue
                          data with your traffic data.{" "}
                          <span className="inline-flex flex-row items-center gap-1">
                            <a
                              href="/docs/revenue-attribution/get-started"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="peer link font-medium text-base-content hover:text-primary"
                            >
                              Get started here
                            </a>{" "}
                            (it takes 2 minutes).
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {selectedProvider === "other" && (
            <div className="space-y-6 pt-6">
              <div className="space-y-2">
                <h2 className="text-base font-semibold text-stone-800">
                  Attributing revenue with Postmetric Payment API
                </h2>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Send payment data from any provider and Postmetric will
                  attribute revenue to your traffic sources.
                </p>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-sm text-stone-700">
                <li>
                  Create a Postmetric{" "}
                  <a
                    href="https://docs.postmetric.io/api-reference/introduction"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-stone-800 underline underline-offset-2 hover:text-stone-900"
                  >
                    API key
                  </a>
                </li>
                <li>
                  Send your payment data to our{" "}
                  <a
                    href="https://docs.postmetric.io/api-reference/payment"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-stone-800 underline underline-offset-2 hover:text-stone-900"
                  >
                    Payment API
                  </a>
                </li>
              </ol>
              <p className="text-sm text-stone-600">
                Need help?{" "}
                <a
                  href="https://docs.postmetric.io/revenue-attribution/get-started"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-stone-800 underline underline-offset-2 hover:text-stone-900"
                >
                  Here is a quick tutorial.
                </a>
              </p>
            </div>
          )}

          {selectedProvider !== "stripe" && selectedProvider !== "other" && (
            <div className="py-8 text-center text-textSecondary">
              <p>
                {selectedProvider.charAt(0).toUpperCase() +
                  selectedProvider.slice(1)}{" "}
                integration coming soon.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="custom-card">
        <form onSubmit={handleSaveCurrency}>
          <CardHeader>
            <CardTitle>Currency</CardTitle>
            <CardDescription>
              Used for all revenue reporting and payment conversion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="input-sm w-full border-base-content/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((curr) => (
                  <SelectItem key={curr.value} value={curr.value}>
                    {curr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="stone"
                size="sm"
                disabled={loading}
              >
                Save
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>

      <AlertDialog
        open={showDisconnectDialog}
        onOpenChange={setShowDisconnectDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to disconnect your Stripe account?
            </AlertDialogTitle>
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="mt-0.5 size-5 shrink-0 text-destructive"
                >
                  <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                </svg>
                <span className="text-sm text-foreground">
                  It will delete all Stripe data for this website.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="mt-0.5 size-5 shrink-0 text-destructive"
                >
                  <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                </svg>
                <span className="text-sm text-foreground">
                  Revenue attribution for upcoming payments won&apos;t work.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="mt-0.5 size-5 shrink-0 text-green-600"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm text-foreground">
                  Previous revenue attribution data will remain.
                </span>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnectStripe}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
