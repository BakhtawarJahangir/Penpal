CREATE DATABASE PenPalDB;
GO

USE PenPalDB;
GO

CREATE TABLE Users
(
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    UserName NVARCHAR(50) UNIQUE NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    Password NVARCHAR(255) NOT NULL,
    ProfilePicture NVARCHAR(500),
    DateCreated DATETIME DEFAULT GETDATE()
);

CREATE TABLE Friends
(
    FriendID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    FriendUserID INT NOT NULL,
    Status NVARCHAR(20) DEFAULT 'Pending',

    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (FriendUserID) REFERENCES Users(UserID)
);

CREATE TABLE Messages
(
    MessageID INT IDENTITY(1,1) PRIMARY KEY,
    SenderID INT NOT NULL,
    ReceiverID INT NOT NULL,
    MessageText NVARCHAR(MAX),
    SentDate DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (SenderID) REFERENCES Users(UserID),
    FOREIGN KEY (ReceiverID) REFERENCES Users(UserID)
);

CREATE TABLE Music
(
    MusicID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    MusicTitle NVARCHAR(200),
    MusicPath NVARCHAR(500),

    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE TABLE Stickers
(
    StickerID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    StickerName NVARCHAR(100),
    StickerPath NVARCHAR(500),

    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

ALTER TABLE Messages
ADD MusicTitle NVARCHAR(200) NULL,
    MusicPath NVARCHAR(500) NULL;