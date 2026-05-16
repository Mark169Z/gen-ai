"use client";

import React, { useState } from "react";

import {
  Download,
  Type,
} from "lucide-react";

import { InboxOutlined } from "@ant-design/icons";

import type {
  UploadFile,
  UploadProps,
} from "antd";

import {
  message,
  Upload,
  Carousel,
} from "antd";

const { Dragger } = Upload;

export default function Home() {

  // -----------------------------------------
  // Source of truth
  // -----------------------------------------

  const characters =
    "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  const [messageApi, contextHolder] =
    message.useMessage();

  const [fileList, setFileList] =
    useState<UploadFile[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [generatedImages,
    setGeneratedImages] =
    useState<Record<string, string>>({});

  const [previewText,
    setPreviewText] =
    useState(
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
    );

  const [generatedFont,
    setGeneratedFont] =
    useState("");

  const [fontUrl,
    setFontUrl] =
    useState("");

  // -----------------------------------------
  // Fetch timeout helper
  // -----------------------------------------

  const fetchWithTimeout = async (
    url: string,
    options: RequestInit,
    timeout = 120000
  ) => {

    const controller =
      new AbortController();

    const id = setTimeout(
      () => controller.abort(),
      timeout
    );

    try {

      const response =
        await fetch(url, {
          ...options,
          signal: controller.signal,
        });

      return response;

    } finally {

      clearTimeout(id);

    }

  };

  // -----------------------------------------
  // Preview API
  // -----------------------------------------

  const handleTransfer = async () => {

    if (!fileList.length) {

      messageApi.error(
        "Please upload files first"
      );

      return;

    }

    try {

      setLoading(true);

      // -----------------------------------------
      // Reset old state
      // -----------------------------------------

      setGeneratedImages({});

      setGeneratedFont("");

      setFontUrl("");

      const formData =
        new FormData();

      formData.append(
        "characters",
        characters
      );

      fileList.forEach((file) => {

        formData.append(
          "style_files",
          file.originFileObj as File
        );

      });

      const response =
        await fetchWithTimeout(
          `${process.env.NEXT_PUBLIC_API_URL}/api/preview`,
          {
            method: "POST",
            body: formData,
          }
        );

      if (!response.ok) {

        throw new Error(
          "Transfer failed"
        );

      }

      const data =
        await response.json();

      // -----------------------------------------
      // Font first
      // -----------------------------------------

      if (!data.font_url) {

        throw new Error(
          "No font generated"
        );

      }

      const font =
        new FontFace(
          "GeneratedFont",
          `url(${data.font_url})`
        );

      await font.load();

      document.fonts.add(font);

      // -----------------------------------------
      // Apply font
      // -----------------------------------------

      setGeneratedFont(
        "GeneratedFont"
      );

      setFontUrl(
        data.font_url
      );

      // -----------------------------------------
      // THEN show images
      // -----------------------------------------

      setGeneratedImages(
        data.images
      );

      messageApi.success(
        "Preview generated successfully"
      );

    } catch (error) {

      console.error(error);

      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {

        messageApi.error(
          "Generation timeout (2 mins)"
        );

      } else {

        messageApi.error(
          "Transfer failed"
        );

      }

    } finally {

      setLoading(false);

    }

  };

  // -----------------------------------------
  // Download TTF
  // -----------------------------------------

  const handleExportTTF = () => {

    if (!fontUrl) {

      messageApi.error(
        "No font generated"
      );

      return;

    }

    const a =
      document.createElement("a");

    a.href = fontUrl;

    a.download = "GenAI.ttf";

    a.click();

  };

  // -----------------------------------------
  // Upload props
  // -----------------------------------------

  const props: UploadProps = {

    name: "style_files",

    multiple: true,

    listType: "picture",

    beforeUpload(file) {

      const previewUrl =
        URL.createObjectURL(file);

      const newFile: UploadFile = {
        uid: file.uid,
        name: file.name,
        status: "done",
        originFileObj: file,
        thumbUrl: previewUrl,
      };

      setFileList((prev) => [
        ...prev,
        newFile,
      ]);

      messageApi.success(
        `${file.name} selected successfully`
      );

      return false;

    },

    onRemove(file) {

      setFileList((prev) =>
        prev.filter(
          (item) =>
            item.uid !== file.uid
        )
      );

    },

    fileList,

  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-zinc-200">

      {contextHolder}

      {/* Ambient Glow */}
      <div className="absolute left-1/4 top-1/4 h-[400px] w-[400px] rounded-full bg-gradient-to-r from-purple-300 to-blue-300 opacity-10 blur-[80px]" />

      <div className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-r from-purple-300 to-blue-300 opacity-5 blur-[80px]" />

      <section className="relative z-10 mx-auto max-w-7xl px-10 pb-20 pt-36">

        <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">

          {/* Upload */}
          <Dragger
            {...props}
            className="
              !border-purple-300/30 
              !bg-transparent 
            "
          >

            <p className="ant-upload-drag-icon">
              <InboxOutlined className="text-purple-300" />
            </p>

            <p className="ant-upload-text font-bold !text-xl text-purple-300">
              Click or drag files to upload
            </p>

            <p className="ant-upload-hint !text-zinc-400">
              Upload your PNG handwriting samples
            </p>

          </Dragger>

          {/* Generate */}
          <div className="mt-6 flex gap-4">

            <button
              onClick={handleTransfer}
              disabled={
                loading ||
                !fileList.length
              }
              className="
                flex items-center justify-center gap-2
                rounded-lg w-full
                border border-purple-300/30
                bg-purple-300/10
                px-8 py-4
                text-base font-bold text-purple-300
                transition
                hover:bg-purple-300/20
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >

              <Download className="h-5 w-5" />

              {loading
                ? "Generating..."
                : "Generate Preview"}

            </button>

          </div>

          {/* Preview */}
          {Object.keys(generatedImages)
            .length > 0 && (

              <div className="mt-10 space-y-6">

                {/* Generated Glyphs */}
                <div className="rounded-2xl border border-white/5 bg-black/40 p-6">

                  <div className="mb-4 text-sm font-medium text-zinc-400">
                    Generated Glyphs
                  </div>

                  <Carousel
                    arrows
                    draggable
                    infinite={false}
                  >

                    {Array.from({
                      length: Math.ceil(
                        Object.entries(
                          generatedImages
                        ).length / 8
                      ),
                    }).map((_, slideIndex) => {

                      const chunk =
                        Object.entries(
                          generatedImages
                        ).slice(
                          slideIndex * 8,
                          slideIndex * 8 + 8
                        );

                      return (

                        <div key={slideIndex}>

                          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 px-2">

                            {chunk.map(
                              ([glyph, image]) => (

                                <div
                                  key={glyph}
                                  className="
                                    flex aspect-square items-center justify-center
                                    overflow-hidden
                                    rounded-xl border border-white/5
                                    bg-white/[0.03]
                                    transition hover:bg-white/10
                                  "
                                >

                                  <img
                                    src={`data:image/png;base64,${image}`}
                                    alt={glyph}
                                    className="
                                      h-full w-full object-contain p-3
                                      invert brightness-200 contrast-200
                                      mix-blend-screen select-none
                                    "
                                  />

                                </div>

                              )
                            )}

                          </div>

                        </div>

                      );

                    })}

                  </Carousel>

                </div>

                {/* Font Preview */}
                <div className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-black/40 p-6">

                  <div className="text-sm font-medium text-zinc-400">
                    Font Preview
                  </div>

                  <div className="flex items-center justify-center">

                    <textarea
                      value={previewText}
                      onChange={(e) =>
                        setPreviewText(
                          e.target.value
                        )
                      }
                      placeholder="Type something..."
                      className="
                        h-[120px]
                        w-full
                        rounded-xl
                        border border-white/10
                        bg-black/60
                        p-6
                        text-9xl
                        leading-relaxed
                        text-white
                        outline-none
                        transition
                        placeholder:text-zinc-600
                        focus:border-purple-300/30
                      "
                      style={{
                        resize: "none",
                        fontFamily:
                          generatedFont ||
                          "sans-serif",
                      }}
                    />

                  </div>

                  {/* Export Button */}
                  <button
                    onClick={handleExportTTF}
                    className="
                      mt-5
                      flex w-full items-center justify-center gap-2
                      rounded-xl
                      border border-purple-300/20
                      bg-purple-300/10
                      px-6 py-4
                      text-lg font-bold text-purple-300
                      transition
                      hover:bg-purple-300/20
                    "
                  >

                    <Type className="h-5 w-5" />

                    Export .TTF

                  </button>

                </div>

              </div>

            )}

        </div>

      </section>

    </main>
  );

}