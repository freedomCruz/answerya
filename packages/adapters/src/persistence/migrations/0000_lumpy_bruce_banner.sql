CREATE TYPE "public"."platform" AS ENUM('instagram', 'facebook', 'youtube', 'tiktok');--> statement-breakpoint
CREATE TYPE "public"."flow_status" AS ENUM('draft', 'active');--> statement-breakpoint
CREATE TYPE "public"."flow_execution_status" AS ENUM('pending', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."message_direction" AS ENUM('inbound', 'outbound');--> statement-breakpoint
CREATE TABLE "connected_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" "platform" NOT NULL,
	"external_id" text NOT NULL,
	"handle" text NOT NULL,
	"token_ciphertext" text NOT NULL,
	"token_expires_at" timestamp with time zone NOT NULL,
	"scopes" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "connected_accounts_platform_external_id_key" UNIQUE("platform","external_id"),
	CONSTRAINT "connected_accounts_token_ciphertext_envelope_check" CHECK ("connected_accounts"."token_ciphertext" ~ '^v[0-9]+.')
);
--> statement-breakpoint
CREATE TABLE "content_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" "platform" NOT NULL,
	"external_id" text NOT NULL,
	"account_id" uuid NOT NULL,
	"type" text NOT NULL,
	"permalink" text NOT NULL,
	"caption" text,
	"published_at" timestamp with time zone NOT NULL,
	CONSTRAINT "content_items_platform_external_id_key" UNIQUE("platform","external_id")
);
--> statement-breakpoint
CREATE TABLE "metric_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_item_id" uuid NOT NULL,
	"captured_at" timestamp with time zone NOT NULL,
	"views" integer NOT NULL,
	"likes" integer NOT NULL,
	"comments" integer NOT NULL,
	"shares" integer NOT NULL,
	"saves" integer NOT NULL,
	"reach" integer NOT NULL,
	CONSTRAINT "metric_snapshots_content_item_id_captured_at_key" UNIQUE("content_item_id","captured_at")
);
--> statement-breakpoint
CREATE TABLE "account_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"captured_at" timestamp with time zone NOT NULL,
	"followers" integer NOT NULL,
	"following" integer NOT NULL,
	"total_views" integer NOT NULL,
	CONSTRAINT "account_snapshots_account_id_captured_at_key" UNIQUE("account_id","captured_at")
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" "platform" NOT NULL,
	"external_id" text NOT NULL,
	"content_item_id" uuid NOT NULL,
	"author_external_id" text NOT NULL,
	"text" text NOT NULL,
	"raw" jsonb NOT NULL,
	CONSTRAINT "comments_platform_external_id_key" UNIQUE("platform","external_id")
);
--> statement-breakpoint
CREATE TABLE "flows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"name" text NOT NULL,
	"status" "flow_status" DEFAULT 'draft' NOT NULL,
	"scope" text NOT NULL,
	"schema_version" integer NOT NULL,
	"graph" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flow_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"flow_id" uuid NOT NULL,
	"comment_id" text NOT NULL,
	"status" "flow_execution_status" DEFAULT 'pending' NOT NULL,
	"current_node_id" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"error" text,
	CONSTRAINT "flow_executions_comment_id_unique" UNIQUE("comment_id")
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"raw" jsonb NOT NULL,
	"dedupe_key" text NOT NULL,
	"signature_ok" boolean NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "webhook_events_dedupe_key_unique" UNIQUE("dedupe_key")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"platform" "platform" NOT NULL,
	"external_thread_id" text NOT NULL,
	"participant_external_id" text NOT NULL,
	"last_message_at" timestamp with time zone,
	CONSTRAINT "conversations_platform_external_thread_id_key" UNIQUE("platform","external_thread_id")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"direction" "message_direction" NOT NULL,
	"text" text NOT NULL,
	"sent_at" timestamp with time zone NOT NULL,
	"raw" jsonb NOT NULL,
	CONSTRAINT "messages_conversation_id_external_id_key" UNIQUE("conversation_id","external_id")
);
--> statement-breakpoint
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_account_id_connected_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."connected_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metric_snapshots" ADD CONSTRAINT "metric_snapshots_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_snapshots" ADD CONSTRAINT "account_snapshots_account_id_connected_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."connected_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flows" ADD CONSTRAINT "flows_account_id_connected_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."connected_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flow_executions" ADD CONSTRAINT "flow_executions_flow_id_flows_id_fk" FOREIGN KEY ("flow_id") REFERENCES "public"."flows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_account_id_connected_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."connected_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;