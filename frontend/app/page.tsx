"use client";

import React, { useState } from "react";

import { Download } from "lucide-react";

import { InboxOutlined } from "@ant-design/icons";

import type {
  UploadFile,
  UploadProps,
} from "antd";

import { Carousel, message, Upload } from "antd";

const { Dragger } = Upload;

export default function Home() {

  // -----------------------------------------
  // Source of truth
  // -----------------------------------------

  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  const [messageApi, contextHolder] =
    message.useMessage();

  const [fileList, setFileList] = useState<
    UploadFile[]
  >([]);

  const [loading, setLoading] =
    useState(false);

  const [generatedImages, setGeneratedImages] =
    useState<Record<string, string>>({});

  // -----------------------------------------
  // Transfer
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

      const formData = new FormData();

      // characters
      formData.append(
        "characters",
        characters
      );

      // style refs
      fileList.forEach((file) => {

        formData.append(
          "style_files",
          file.originFileObj as File
        );

      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/transfer`,
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

      const data = await response.json();

      setGeneratedImages(data);

      messageApi.success(
        "Font generated successfully"
      );

    } catch (error) {

      console.error(error);

      messageApi.error(
        "Transfer failed"
      );

    } finally {

      setLoading(false);

    }
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

      // prevent auto upload
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

          {/* Generate Button */}
          <div className="mt-6">

            <button
              onClick={handleTransfer}
              disabled={
                loading ||
                !fileList.length
              }
              className="
                flex w-full items-center justify-center gap-2
                rounded-lg
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
                : "Generate Font"}
            </button>

          </div>

          {/* Preview */}
          {Object.keys(generatedImages)
            .length > 0 && (

            <div className="mt-10 rounded-2xl border border-white/5 bg-black/40 p-6">

              <Carousel arrows infinite={false} draggable={true}>

                {(() => {
                  const entries = Object.entries(
                    generatedImages
                  );

                  const slides = [] as Array<
                    typeof entries
                  >;

                  for (
                    let i = 0;
                    i < entries.length;
                    i += 8
                  ) {
                    slides.push(
                      entries.slice(i, i + 8)
                    );
                  }

                  return slides.map(
                    (slideEntries, index) => (

                      <div key={`slide-${index}`}>

                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">

                          {slideEntries.map(
                            ([glyph, image]) => (

                              <div
                                key={glyph}
                                className="
                                  flex aspect-square items-center justify-center
                                  overflow-hidden
                                  rounded-xl border border-white/5
                                  bg-white/[0.03]
                                  transition hover:bg-white/10
                                  select-none
                                "
                              >

                                <img
                                  src={`data:image/png;base64,${image}`}
                                  alt={glyph}
                                  className="
                                    h-full w-full object-contain p-3
                                    invert brightness-200 contrast-200
                                    mix-blend-screen
                                  "
                                />

                              </div>

                            )
                          )}

                        </div>

                      </div>

                    )
                  );
                })()}

              </Carousel>

            </div>

          )}

        </div>

      </section>

    </main>
  );
}