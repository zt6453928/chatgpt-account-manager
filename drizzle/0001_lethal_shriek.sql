CREATE TABLE `chatgptAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`password` text NOT NULL,
	`accountType` enum('free','plus','pro') NOT NULL DEFAULT 'free',
	`status` enum('active','inactive','expired','banned') NOT NULL DEFAULT 'inactive',
	`notes` text,
	`lastVerified` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatgptAccounts_id` PRIMARY KEY(`id`)
);
