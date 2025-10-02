"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { Loader2, Key } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Sign In</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                  value={email}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                      href="#"
                      className="ml-auto inline-block text-sm underline"
                    >
                      Forgot your password?
                    </Link>
                </div>

                <Input
                  id="password"
                  type="password"
                  placeholder="password"
                  autoComplete="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    onClick={() => {
                      setRememberMe(!rememberMe);
                    }}
                  />
                  <Label htmlFor="remember">Remember me</Label>
                </div>



            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <Button
                type="submit"
                className="w-full"
                disabled={loading}
                onClick={async () => {
                  setError("");
                  try {
                    await signIn.email(
                    {
                        email,
                        password
                    },
                    {
                      onRequest: (ctx) => {
                        setLoading(true);
                      },
                      onResponse: (ctx) => {
                        setLoading(false);
                      },
                      onError: (ctx) => {
                        setError(ctx.error.message || "Sign in failed");
                      },
                      onSuccess: (ctx) => {
                        window.location.href = "/admin";
                      },
                    },
                    );
                  } catch (err) {
                    setError("Network error. Please try again.");
                    setLoading(false);
                  }
                }}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <p> Login </p>
                )}
                </Button>



            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Need an account?{' '}
                <Link href="/auth/signup" className="text-blue-600 hover:underline">
                  Sign up
                </Link>
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Don't need an account?{' '}
                <Link href="/submit" className="text-blue-600 hover:underline">
                  Submit as guest
                </Link>
              </p>
            </div>

              <div className="mt-6 pt-6 border-t">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Demo Accounts:</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <p><strong>Super Admin:</strong> superadmin@example.com / superadmin123</p>
                  <p><strong>Course Admin:</strong> courseadmin@example.com / courseadmin123</p>
                  <p><strong>Student:</strong> student@example.com / student123</p>
                </div>
              </div>
          </div>
        </CardContent>
        <CardFooter>
            <div className="flex justify-center w-full border-t py-4">
              <p className="text-center text-xs text-neutral-500">
               built with{" "}
                <Link
                  href="https://better-auth.com"
                  className="underline"
                  target="_blank"
                >
                  <span className="dark:text-white/70 cursor-pointer">
                                      better-auth.
                                  </span>
                </Link>
              </p>
            </div>
          </CardFooter>
      </Card>
    </div>
  );
}