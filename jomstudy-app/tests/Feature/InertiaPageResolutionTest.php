<?php

test('all statically referenced Inertia pages exist with exact casing', function () {
    $components = [];

    foreach ([app_path(), base_path('routes')] as $sourceDirectory) {
        $files = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($sourceDirectory, FilesystemIterator::SKIP_DOTS),
        );

        foreach ($files as $file) {
            if (! $file->isFile() || $file->getExtension() !== 'php') {
                continue;
            }

            $contents = file_get_contents($file->getPathname());

            preg_match_all(
                '/(?:Inertia::render|inertia)\(\s*[\'\"]([^\'\"]+)[\'\"]/',
                $contents,
                $renderMatches,
            );
            preg_match_all(
                '/Route::inertia\(\s*[\'\"][^\'\"]+[\'\"]\s*,\s*[\'\"]([^\'\"]+)[\'\"]/',
                $contents,
                $routeMatches,
            );

            array_push($components, ...$renderMatches[1], ...$routeMatches[1]);
        }
    }

    $pageDirectory = resource_path('js/pages');
    $pageFiles = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($pageDirectory, FilesystemIterator::SKIP_DOTS),
    );
    $availableComponents = [];

    foreach ($pageFiles as $file) {
        if (! $file->isFile() || $file->getExtension() !== 'tsx') {
            continue;
        }

        $relativePath = substr($file->getPathname(), strlen($pageDirectory) + 1);
        $availableComponents[] = str_replace(DIRECTORY_SEPARATOR, '/', substr($relativePath, 0, -4));
    }

    $missingComponents = array_values(array_diff(array_unique($components), $availableComponents));

    expect($components)->not->toBeEmpty()
        ->and($missingComponents)->toBe([]);
});
