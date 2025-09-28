import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRightLeft, Send } from 'lucide-react';

interface TransferFormProps {
  onTransferSubmit: (transfer: TransferData) => void;
  isTransferring: boolean;
}

export interface TransferData {
  fromCountry: string;
  toCountry: string;
  amount: number;
  fromCurrency: string;
  toCurrency: string;
}

const countries = [
  { code: 'UK', name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧' },
  { code: 'US', name: 'United States', currency: 'USD', flag: '🇺🇸' },
  { code: 'IN', name: 'India', currency: 'INR', flag: '🇮🇳' },
  { code: 'CA', name: 'Canada', currency: 'CAD', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', currency: 'AUD', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', currency: 'EUR', flag: '🇩🇪' },
  { code: 'JP', name: 'Japan', currency: 'JPY', flag: '🇯🇵' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', flag: '🇸🇬' },
  { code: 'AE', name: 'UAE', currency: 'AED', flag: '🇦🇪' },
];
const TransferForm: React.FC<TransferFormProps> = ({ onTransferSubmit, isTransferring }) => {
  const [fromCountry, setFromCountry] = useState('UK');
  const [toCountry, setToCountry] = useState('IN');
  const [amount, setAmount] = useState('');

  const fromCountryData = countries.find((c) => c.code === fromCountry);
  const toCountryData = countries.find((c) => c.code === toCountry);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) return;

    const transferData: TransferData = {
      fromCountry,
      toCountry,
      amount: parseFloat(amount),
      fromCurrency: fromCountryData?.currency || 'USD',
      toCurrency: toCountryData?.currency || 'USD',
    };

    onTransferSubmit(transferData);
  };

  const swapCountries = () => {
    const temp = fromCountry;
    setFromCountry(toCountry);
    setToCountry(temp);
  };

  const exchangeRate = 1.2; // Mock exchange rate
  const convertedAmount = amount ? (parseFloat(amount) * exchangeRate).toFixed(2) : '0';

  return (
    <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm border-border/50 shadow-2xl">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Send Money Globally
        </CardTitle>
        <p className="text-muted-foreground text-sm">Fast, secure, and reliable transfers worldwide</p>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* From Country */}
          <div className="space-y-2">
            <Label htmlFor="from-country" className="text-sm font-medium">
              Send from
            </Label>
            <Select value={fromCountry} onValueChange={setFromCountry}>
              <SelectTrigger className="bg-background/50 border-border/50 focus:border-primary transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    <div className="flex items-center gap-2">
                      <span>{country.flag}</span>
                      <span>{country.name}</span>
                      <span className="text-muted-foreground">({country.currency})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={swapCountries}
              className="rounded-full p-2 hover:bg-primary/10 hover:border-primary transition-all duration-200"
            >
              <ArrowRightLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* To Country */}
          <div className="space-y-2">
            <Label htmlFor="to-country" className="text-sm font-medium">
              Send to
            </Label>
            <Select value={toCountry} onValueChange={setToCountry}>
              <SelectTrigger className="bg-background/50 border-border/50 focus:border-primary transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    <div className="flex items-center gap-2">
                      <span>{country.flag}</span>
                      <span>{country.name}</span>
                      <span className="text-muted-foreground">({country.currency})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">
              Amount to send
            </Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="bg-background/50 border-border/50 focus:border-primary transition-colors pl-16"
                required
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                {fromCountryData?.currency}
              </div>
            </div>
          </div>

          {/* Conversion Display */}
          {amount && parseFloat(amount) > 0 && (
            <div className="p-4 bg-muted/20 rounded-lg border border-border/30">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">You send</span>
                <span className="font-semibold">
                  {amount} {fromCountryData?.currency}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-muted-foreground">Recipient gets</span>
                <span className="font-semibold text-primary">
                  {convertedAmount} {toCountryData?.currency}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-2 text-center">
                Exchange rate: 1 {fromCountryData?.currency} = {exchangeRate} {toCountryData?.currency}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!amount || parseFloat(amount) <= 0 || isTransferring}
            className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold py-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTransferring ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Processing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Send Money
              </div>
            )}
          </Button>
        </form>

        {/* Trust indicators */}
        <div className="pt-4 border-t border-border/30">
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="text-accent">✓</span>
              Bank-level security
            </div>
            <div className="flex items-center gap-1">
              <span className="text-accent">✓</span>
              Licensed & regulated
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(TransferForm);